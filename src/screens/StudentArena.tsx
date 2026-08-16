import React, { useEffect, useReducer, useState } from 'react';
import {
  BrainIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CoinsIcon,
  FlameIcon,
  LockIcon,
  PiggyBankIcon,
  PlayIcon,
  ShieldIcon,
  ShoppingBagIcon,
  StarIcon,
  SwordsIcon,
  TargetIcon,
  TrophyIcon,
  Volume2Icon,
  VolumeXIcon,
  ZapIcon } from
'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { TopicJourney } from '../components/TopicJourney';
import { GamePlay } from './GamePlay';
import { GameShop } from './GameShop';
import { GameLeague } from './GameLeague';
import { BattleEntry } from './BattleEntry';
import { SprintPlay } from './SprintPlay';
import { CurriculumUnits } from './CurriculumUnits';
import type { PlayResult } from './GamePlay';
import { t } from '../strings';
import { haptic } from '../tokens';
import { sound, setSoundMuted } from '../sound';
import {
  dailyPool,
  gameState,
  lifeQuestions,
  markDailyProgress,
  nextUnitAfter,
  playerLevel,
  quests,
  reviewPool,
  streakWeekState,
  tournament,
  unitOf,
  weeklyMission,
  xpIntoLevel,
  XP_PER_LEVEL } from
'../gameData';
import type { GameLevel, GameUnit } from '../gameData';
import { useUI } from '../ui';
import type { UIApi } from '../ui';
import { student } from '../mockData';

const GOLD = 'hsl(42 96% 50%)';
const DAILY_BONUS = 15;

type Category = 'path' | 'battle' | 'speed' | 'daily' | 'life';

const CATEGORY_IDS: Category[] = ['path', 'battle', 'speed', 'daily', 'life'];

function categoryLabel(c: Category): string {
  switch (c) {
    case 'path':return t.catPath;
    case 'battle':return t.catBattle;
    case 'speed':return t.catSpeed;
    case 'daily':return t.catDaily;
    case 'life':return t.catLife;
  }
}


export function StudentArena({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const locked = ui.gameLocked;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [cat, setCat] = useState<Category>('path');
  const [justUnlockedId, setJustUnlockedId] = useState<number | null>(null);
  const [celebrateUnlockId, setCelebrateUnlockId] = useState<number | null>(null);

  useEffect(() => {
    if (justUnlockedId === null) return;
    const id = window.setTimeout(() => setJustUnlockedId(null), 1600);
    return () => window.clearTimeout(id);
  }, [justUnlockedId]);

  /* safety net: never leave a stale popper armed (overlay clears it earlier) */
  useEffect(() => {
    if (celebrateUnlockId === null) return;
    const id = window.setTimeout(() => setCelebrateUnlockId(null), 2600);
    return () => window.clearTimeout(id);
  }, [celebrateUnlockId]);

  function guard(): boolean {
    if (locked) {
      haptic('warning');
      ui.toast(t.gameLockTitle, 'warning');
      return false;
    }
    return true;
  }

  /** Any finished game keeps today's streak alive. */
  function creditStreak() {
    if (markDailyProgress()) {
      window.setTimeout(() => ui.toast(t.streakToast(gameState.streak), 'success'), 600);
    }
  }

  /** After a game closes, celebrate level-ups / topic unlocks on top of the hub. */
  function celebrate(levelBefore: number, unlockedTopic: GameUnit | null) {
    const levelAfter = playerLevel();
    if (unlockedTopic) {
      window.setTimeout(() => {
        ui.openFullScreen(
          <TopicUnlockOverlay next={unlockedTopic} onClose={ui.closeFullScreen} />
        );
      }, 120);
    } else if (levelAfter > levelBefore) {
      window.setTimeout(() => {
        ui.openFullScreen(
          <LevelUpOverlay level={levelAfter} onClose={ui.closeFullScreen} />
        );
      }, 120);
    }
  }

  function openLevel(level: GameLevel) {
    if (!guard()) return;
    if (level.id > gameState.currentId) {
      haptic('light');
      ui.toast(t.levelLocked);
      return;
    }
    if (gameState.energy === 0) {
      haptic('warning');
      ui.toast(t.playNoEnergyBody, 'warning');
      return;
    }
    const unit = unitOf(level);
    const bank = level.kind === 'boss' ? unit.questions.slice(0, 6) : unit.questions.slice(0, 5);
    haptic('light');
    sound.tap();
    ui.openFullScreen(
      <GamePlay
        title={level.title}
        boss={level.kind === 'boss'}
        questions={bank}
        onClose={ui.closeFullScreen}
        onDone={(result: PlayResult) => {
          const levelBefore = playerLevel();
          const advances = level.id === gameState.currentId && result.stars >= 1;
          gameState.xp += result.xp;
          gameState.coins += result.coins;
          const prev = gameState.stars[level.id] ?? 0;
          gameState.stars[level.id] = Math.max(prev, result.stars);
          let unlockedTopic: GameUnit | null = null;
          if (advances) {
            gameState.currentId += 1;
            setJustUnlockedId(gameState.currentId);
            if (level.kind === 'boss') unlockedTopic = nextUnitAfter(unit);
            /* popper only when no full-screen overlay takes the stage —
               one celebration at a time, never stacked */
            if (!unlockedTopic && playerLevel() === levelBefore) {
              setCelebrateUnlockId(gameState.currentId);
            }
          }
          if (result.stars > 0) creditStreak();
          bump();
          celebrate(levelBefore, unlockedTopic);
        }} />

    );
  }

  function openSpecial(title: string, bank: ReturnType<typeof dailyPool>, daily?: boolean) {
    if (!guard()) return;
    haptic('light');
    sound.tap();
    ui.openFullScreen(
      <GamePlay
        title={title}
        questions={bank}
        onClose={ui.closeFullScreen}
        onDone={(result: PlayResult) => {
          const levelBefore = playerLevel();
          gameState.xp += result.xp;
          gameState.coins += result.coins;
          if (daily && !gameState.dailyDone && result.stars > 0) {
            gameState.dailyDone = true;
            gameState.coins += DAILY_BONUS;
            sound.coin();
            ui.toast(t.dailyBonus(DAILY_BONUS), 'success');
          }
          if (result.stars > 0) creditStreak();
          bump();
          celebrate(levelBefore, null);
        }} />

    );
  }

  function openBattle() {
    if (!guard()) return;
    haptic('light');
    sound.tap();
    ui.push({
      key: 'battle-entry',
      backTitle: t.tabGame,
      node:
      <BattleEntry
        onChanged={() => {
          creditStreak();
          bump();
        }} />

    });
  }

  function openSprint() {
    if (!guard()) return;
    haptic('light');
    sound.tap();
    ui.openFullScreen(
      <SprintPlay
        onClose={ui.closeFullScreen}
        onFinished={() => {
          creditStreak();
          bump();
        }} />

    );
  }

  return (
    <ScrollScreen
      title={t.tabGame}
      subtitle={t.todayGreeting(student.firstName)}
      scrollKey="student-arena"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      trailing={
      <ResourceCluster
        onShop={() => {
          sound.tap();
          pushShop(ui);
        }}
        onInfo={(msg) => ui.toast(msg)} />

      }
      belowTitle={
      <>
          <LevelLine
          onToggleSound={() => {
            gameState.muted = !gameState.muted;
            setSoundMuted(gameState.muted);
            if (!gameState.muted) sound.tap();
            bump();
          }} />

          <CategoryTabs active={cat} onSelect={setCat} />
        </>
      }>

      {dataState === 'loading' ?
      <ScreenSkeleton /> :
      dataState === 'error' ?
      <ErrorState onRetry={() => undefined} /> :

      <div className="space-y-7">
          {locked && <LockCard />}

          {cat === 'path' &&
        <TopicJourney
          locked={locked}
          justUnlockedId={justUnlockedId}
          celebrateUnlockId={celebrateUnlockId}
          onCelebrationDone={() => setCelebrateUnlockId(null)}
          onOpenLevel={openLevel}
          onOpenBattle={openBattle}
          onAllTopics={() => {
            sound.tap();
            ui.push({
              key: 'units',
              backTitle: t.tabGame,
              node: <CurriculumUnits locked={locked} onOpen={openLevel} />
            });
          }} />

        }

          {cat === 'battle' &&
        <>
              <BattleHero locked={locked} onOpen={openBattle} />
              <TournamentCard locked={locked} />
              <LeagueCard locked={locked} />
            </>
        }

          {cat === 'speed' &&
        <GameRow
          icon={ZapIcon}
          title={t.sprintTitle}
          body={t.sprintBody}
          meta={t.sprintBest(gameState.sprintBest)}
          locked={locked}
          onOpen={openSprint} />

        }

          {cat === 'daily' &&
        <>
              <StreakCard />
              <DailyCard
            locked={locked}
            onStart={() => openSpecial(t.dailyTitle, dailyPool(), true)} />

              <GameRow
            icon={BrainIcon}
            title={t.reviewTitle}
            body={t.reviewBody}
            meta={t.reviewSource}
            locked={locked}
            onOpen={() => openSpecial(t.reviewTitle, reviewPool())} />

              <NeonMission locked={locked} />
            </>
        }

          {cat === 'life' &&
        <GameRow
          icon={PiggyBankIcon}
          title={t.lifeTitle}
          body={t.lifeBody}
          meta={`${lifeQuestions.length} masala`}
          locked={locked}
          onOpen={() => openSpecial(t.lifeTitle, lifeQuestions.slice(0, 5))} />

        }
        </div>
      }
    </ScrollScreen>);

}

function pushShop(ui: UIApi) {
  ui.push({ key: 'game-shop', backTitle: t.tabGame, node: <GameShop /> });
}

/* ── Celebration overlays ──────────────────────────────── */

function LevelUpOverlay({ level, onClose }: {level: number;onClose: () => void;}) {
  useEffect(() => {
    haptic('success');
    sound.start();
    const id = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <button
      type="button"
      onClick={onClose}
      className="fade-in absolute inset-0 z-[70] flex w-full flex-col items-center justify-center bg-background/95 backdrop-blur-sm">

      <span className="relative flex items-center justify-center">
        <span className="level-burst absolute h-[120px] w-[120px] rounded-full border-2 border-primary/60" />
        <span
          className="level-burst absolute h-[120px] w-[120px] rounded-full border border-primary/40"
          style={{ animationDelay: '180ms' }} />

        <span
          className="pop-in flex h-[110px] w-[110px] items-center justify-center rounded-full bg-primary font-display text-[44px] font-bold tabular-nums text-primaryfg"
          style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.55)' }}>

          {level}
        </span>
      </span>
      <h2 className="slide-up-fade mt-6 font-display text-title1 font-bold text-foreground" style={{ animationDelay: '250ms' }}>
        {t.levelUpTitle}
      </h2>
      <p className="slide-up-fade mt-1 font-sans text-headline font-semibold text-primary" style={{ animationDelay: '350ms' }}>
        {t.arenaLevel(level)}
      </p>
      <p className="slide-up-fade mt-8 font-sans text-footnote text-mutedfg" style={{ animationDelay: '600ms' }}>
        {t.tapToContinue}
      </p>
    </button>);

}

function TopicUnlockOverlay({ next, onClose }: {next: GameUnit;onClose: () => void;}) {
  useEffect(() => {
    haptic('success');
    sound.fanfare();
    const id = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <button
      type="button"
      onClick={onClose}
      className="fade-in absolute inset-0 z-[70] flex w-full flex-col items-center justify-center bg-background/95 px-8 backdrop-blur-sm">

      <span className="pop-in flex h-[84px] w-[84px] items-center justify-center rounded-full bg-good" style={{ boxShadow: '0 0 34px hsl(var(--good) / 0.5)' }}>
        <CheckIcon size={40} strokeWidth={3} className="text-white" />
      </span>
      <h2 className="slide-up-fade mt-5 font-display text-title1 font-bold text-foreground" style={{ animationDelay: '200ms' }}>
        {t.topicDoneTitle}
      </h2>

      <div className="slide-up-fade mt-8 w-full" style={{ animationDelay: '500ms' }}>
        <div
          className="unlock-in rounded-card border border-primary/40 bg-card p-4"
          style={{ animationDelay: '650ms', boxShadow: '0 8px 30px hsl(var(--primary) / 0.2)' }}>

          <p className="font-sans text-caption font-bold tracking-[1.2px] text-primary">
            {t.topicUnlockedCaption}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-primary/[0.1]">
              <StarIcon size={20} className="text-primary" />
            </span>
            <h3 className="font-display text-title2 font-bold text-foreground">{next.title}</h3>
          </div>
        </div>
      </div>
      <p className="slide-up-fade mt-8 font-sans text-footnote text-mutedfg" style={{ animationDelay: '900ms' }}>
        {t.tapToContinue}
      </p>
    </button>);

}

/* ── Category text tabs — quiet, typographic ──────────── */

function CategoryTabs({
  active,
  onSelect



}: {active: Category;onSelect: (c: Category) => void;}) {
  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto px-4 pb-2 pt-1">
      {CATEGORY_IDS.map((id) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              haptic('light');
              onSelect(id);
            }}
            className="relative flex h-[40px] shrink-0 items-center transition-transform duration-100 ease-out active:scale-[0.96]">

            <span
              className={[
              'font-sans text-[16px] transition-[color,font-weight] duration-150',
              isActive ? 'font-bold text-foreground' : 'font-medium text-mutedfg/70'].
              join(' ')}>

              {categoryLabel(id)}
            </span>
            {isActive &&
            <span className="tab-underline absolute -bottom-[1px] left-0 right-0 h-[3px] rounded-full bg-primary" />
            }
          </button>);

      })}
    </div>);

}

/* ── Compact resource cluster (nav trailing) ──────────── */

function ResourceCluster({
  onShop,
  onInfo



}: {onShop: () => void;onInfo: (msg: string) => void;}) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onInfo(t.streakInfo(gameState.streak))}
        aria-label={t.streakInfo(gameState.streak)}
        className="flex h-[40px] items-center gap-[3px] px-[5px] font-sans text-subhead font-bold tabular-nums text-foreground transition-transform duration-100 ease-out active:scale-[0.92]">

        <FlameIcon
          size={15}
          className="flame-dance"
          style={{ color: 'hsl(20 95% 55%)', fill: 'hsl(32 98% 58%)' }} />

        {gameState.streak}
      </button>
      <button
        type="button"
        onClick={() => onInfo(t.energyInfo(gameState.energy, gameState.energyMax))}
        aria-label={t.energyInfo(gameState.energy, gameState.energyMax)}
        className="flex h-[40px] items-center gap-[3px] px-[5px] font-sans text-subhead font-bold tabular-nums text-foreground transition-transform duration-100 ease-out active:scale-[0.92]">

        <ZapIcon size={15} className="text-primary" fill="currentColor" fillOpacity={0.25} />
        {gameState.energy}
      </button>
      <button
        type="button"
        onClick={() => onInfo(t.shopEarnHint)}
        aria-label={t.playCoins}
        className="flex h-[40px] items-center gap-[4px] px-[6px] font-sans text-[17px] font-bold tabular-nums text-foreground transition-transform duration-100 ease-out active:scale-[0.92]">

        <CoinsIcon size={19} style={{ color: GOLD }} />
        {gameState.coins}
      </button>
      <button
        type="button"
        onClick={onShop}
        aria-label={t.shopTitle}
        className="ml-[2px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary/[0.08] text-primary transition-transform duration-100 ease-out active:scale-[0.9]">

        <ShoppingBagIcon size={16} />
      </button>
    </div>);

}

/* ── Level as part of identity — thin typographic line ── */

function LevelLine({ onToggleSound }: {onToggleSound: () => void;}) {
  const level = playerLevel();
  const into = xpIntoLevel();
  return (
    <div className="flex items-center gap-3 px-4 pb-3 pt-1">
      <span className="font-sans text-footnote font-bold uppercase tracking-[1px] text-primary">
        {t.arenaLevel(level)}
      </span>
      <span className="relative h-[3px] w-[92px] overflow-hidden rounded-full bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${into / XP_PER_LEVEL * 100}%`, boxShadow: '0 0 6px hsl(var(--primary) / 0.6)' }} />

      </span>
      <span className="font-sans text-caption tabular-nums text-mutedfg">
        {into}/{XP_PER_LEVEL} XP
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={onToggleSound}
        aria-label={gameState.muted ? t.soundOffLabel : t.soundOnLabel}
        className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-mutedfg transition-transform duration-100 ease-out active:scale-[0.9]">

        {gameState.muted ? <VolumeXIcon size={15} /> : <Volume2Icon size={15} />}
      </button>
    </div>);

}

/* ── Battle hero ───────────────────────────────────────── */

function BattleHero({ locked, onOpen }: {locked: boolean;onOpen: () => void;}) {
  return (
    <section className="px-4">
      <button
        type="button"
        onClick={onOpen}
        className={[
        'w-full rounded-card p-4 text-left transition-transform duration-100 ease-out active:scale-[0.98]',
        locked ? 'bg-muted' : 'bg-primary'].
        join(' ')}
        style={locked ? undefined : { boxShadow: '0 10px 28px hsl(var(--primary) / 0.28)' }}>

        <div className="flex items-center gap-4">
          <span
            className={[
            'flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[16px]',
            locked ? 'bg-card' : 'bg-white/[0.16]'].
            join(' ')}>

            {locked ?
            <LockIcon size={24} className="text-mutedfg" /> :

            <SwordsIcon size={26} className="text-primaryfg" />
            }
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={[
              'font-sans text-caption font-bold tracking-[1px]',
              locked ? 'text-mutedfg' : 'text-primaryfg/70'].
              join(' ')}>

              {t.battleHeroCaption}
            </p>
            <h2
              className={[
              'mt-[2px] truncate font-display text-title3 font-bold',
              locked ? 'text-mutedfg' : 'text-primaryfg'].
              join(' ')}>

              {t.battleHeroTitle}
            </h2>
            <p
              className={[
              'mt-[2px] font-sans text-subhead',
              locked ? 'text-mutedfg' : 'text-primaryfg/80'].
              join(' ')}>

              {t.battleHeroBody}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span
            className={[
            'flex items-center gap-[6px] font-sans text-footnote font-semibold tabular-nums',
            locked ? 'text-mutedfg' : 'text-primaryfg/80'].
            join(' ')}>

            <TrophyIcon size={14} />
            {t.battleStats(gameState.battleWins, gameState.battlePlayed)}
          </span>
          <span
            className={[
            'sheen relative flex h-[40px] items-center overflow-hidden rounded-full px-4 font-sans text-subhead font-bold',
            locked ? 'bg-card text-mutedfg' : 'bg-white text-primary'].
            join(' ')}>

            {t.battleHeroCta}
          </span>
        </div>
      </button>
    </section>);

}

/* ── Streak ────────────────────────────────────────────── */

function StreakCard() {
  const FIRE = 'linear-gradient(160deg, hsl(38 98% 55%), hsl(18 95% 52%), hsl(345 85% 52%))';
  const burning = gameState.todayDone;
  return (
    <section className="px-4">
      <div className="rounded-card border border-cardborder bg-card p-4">
        <div className="flex items-center gap-4">
          <div
            className="fire-glow relative flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[18px]"
            style={{ background: FIRE }}>

            <FlameIcon
              size={34}
              className="flame-dance text-white"
              fill="hsl(48 100% 78%)" />

            <span className="absolute -bottom-[7px] rounded-full border border-cardborder bg-card px-2 font-display text-subhead font-bold tabular-nums text-foreground">
              {gameState.streak}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-title3 font-bold text-foreground">
              {t.streakTitle(gameState.streak)}
            </h2>
            <p className="mt-[2px] font-sans text-subhead text-mutedfg">{t.streakBody}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between border-t border-hairline pt-4">
          {streakWeekState().map((state, i) => {
            const doneCell = state === 'done' || state === 'today' && burning;
            const todayCell = state === 'today';
            return (
              <div key={t.weekdaysShort[i]} className="flex flex-col items-center gap-[6px]">
                <span
                  className={[
                  'flex h-[30px] w-[30px] items-center justify-center rounded-full',
                  doneCell ? '' : todayCell ? 'bg-[hsl(20_95%_55%_/_0.14)]' : 'bg-muted'].
                  join(' ')}
                  style={doneCell ? { background: FIRE, boxShadow: '0 2px 10px hsl(20 95% 52% / 0.4)' } : undefined}>

                  {doneCell && todayCell ?
                  <FlameIcon size={15} className="flame-dance text-white" fill="hsl(48 100% 78%)" /> :
                  doneCell ?
                  <CheckIcon size={15} strokeWidth={3} className="text-white" /> :
                  todayCell ?
                  <FlameIcon
                    size={14}
                    className="flame-dance"
                    style={{ color: 'hsl(20 95% 55%)', fill: 'hsl(32 98% 58% / 0.5)' }} /> :

                  null}
                </span>
                <span
                  className={[
                  'font-sans text-caption',
                  todayCell ? 'font-bold text-foreground' : 'text-mutedfg'].
                  join(' ')}>

                  {t.weekdaysShort[i]}
                </span>
              </div>);

          })}
        </div>
      </div>
    </section>);

}

/* ── Daily challenge ───────────────────────────────────── */

function DailyCard({ locked, onStart }: {locked: boolean;onStart: () => void;}) {
  const done = gameState.dailyDone;
  return (
    <section className="px-4">
      <div className="rounded-card border border-cardborder bg-card p-4">
        <div className="flex items-center gap-3">
          <span
            className={[
            'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]',
            done ? 'bg-good/[0.12]' : 'bg-primary/[0.1]'].
            join(' ')}>

            {done ?
            <CheckIcon size={22} className="text-good" /> :

            <TargetIcon size={22} className="text-primary" />
            }
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-headline font-bold text-foreground">{t.dailyTitle}</h3>
            <p className="mt-[1px] font-sans text-footnote text-mutedfg">
              {done ? t.dailyDone : t.dailyBody}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-[3px] font-sans text-caption font-bold tabular-nums text-foreground">
            <CoinsIcon size={12} style={{ color: GOLD }} />+{DAILY_BONUS}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-[6px]">
            {[0, 1, 2, 3, 4].map((i) =>
            <span
              key={i}
              className={[
              'h-[6px] flex-1 rounded-full',
              done ? 'bg-good' : 'bg-muted'].
              join(' ')} />

            )}
          </div>
          <button
            type="button"
            disabled={done || locked}
            onClick={onStart}
            className={[
            'flex h-[44px] shrink-0 items-center gap-2 rounded-full px-5 font-sans text-subhead font-bold transition-transform duration-100 ease-out active:scale-[0.96]',
            done || locked ?
            'bg-muted text-mutedfg' :
            'glow-pulse bg-primary text-primaryfg'].
            join(' ')}>

            {!done && !locked && <PlayIcon size={15} fill="currentColor" />}
            {done ? t.doneLabel : t.startLesson}
          </button>
        </div>
      </div>
    </section>);

}

/* ── Generic game row ──────────────────────────────────── */

function GameRow({
  icon: Icon,
  title,
  body,
  meta,
  locked,
  onOpen






}: {icon: typeof ZapIcon;title: string;body: string;meta: string;locked: boolean;onOpen: () => void;}) {
  return (
    <section className="px-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-card border border-cardborder bg-card p-4 text-left transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-80">

        <span
          className={[
          'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]',
          locked ? 'bg-muted' : 'bg-primary/[0.1]'].
          join(' ')}>

          <Icon size={22} className={locked ? 'text-mutedfg' : 'text-primary'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-headline font-bold text-foreground">{title}</p>
          <p className="mt-[1px] font-sans text-footnote leading-snug text-mutedfg">{body}</p>
          <p className="mt-1 font-sans text-caption font-semibold tabular-nums text-primary">
            {meta}
          </p>
        </div>
        <span
          className={[
          'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full',
          locked ? 'bg-muted' : 'bg-primary'].
          join(' ')}>

          {locked ?
          <LockIcon size={15} className="text-mutedfg" /> :

          <PlayIcon size={15} className="ml-[2px] text-primaryfg" fill="currentColor" />
          }
        </span>
      </button>
    </section>);

}

/* ── Neon weekly mission ───────────────────────────────── */

function NeonMission({ locked }: {locked: boolean;}) {
  const m = weeklyMission;
  const pct = Math.min(m.current / m.goal, 1) * 100;
  return (
    <section className="px-4">
      <div
        className={['relative overflow-hidden rounded-card p-4', locked ? 'opacity-60' : ''].join(' ')}
        style={{
          background: 'linear-gradient(155deg, hsl(228 45% 13%), hsl(232 48% 8%))',
          boxShadow: '0 10px 30px hsl(228 45% 8% / 0.35)'
        }}>

        <span
          className="pointer-events-none absolute -right-10 -top-14 h-[140px] w-[140px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(224 94% 60% / 0.22), transparent 70%)' }} />

        <span
          className="pointer-events-none absolute -bottom-16 -left-8 h-[140px] w-[140px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(199 89% 55% / 0.14), transparent 70%)' }} />


        <div className="relative flex items-center justify-between">
          <h2 className="font-display text-title3 font-bold text-white">{t.missionHeader}</h2>
          <span className="flex items-center gap-1 font-sans text-footnote font-semibold" style={{ color: 'hsl(199 89% 62%)' }}>
            <ClockIcon size={13} />
            {t.missionDaysLeft(m.daysLeft)}
          </span>
        </div>

        <div className="relative mt-3 flex items-baseline justify-between">
          <p className="font-sans text-subhead font-semibold text-white/85">{m.title}</p>
          <p className="font-sans text-headline font-bold tabular-nums text-white">
            <span style={{ color: 'hsl(199 89% 62%)' }}>{m.current}</span>
            <span className="text-white/40">/{m.goal}</span>
          </p>
        </div>

        <div className="relative mb-1 mt-4 h-[14px]">
          <div className="absolute inset-y-[3px] left-0 right-0 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="sheen relative h-full overflow-hidden rounded-full"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, hsl(224 94% 58%), hsl(199 89% 55%))',
                boxShadow: '0 0 14px hsl(210 92% 56% / 0.65)'
              }} />

          </div>
          {m.milestones.map((milestone) => {
            const reached = m.current >= milestone;
            const left = milestone / m.goal * 100;
            return (
              <span
                key={milestone}
                className="absolute top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full border-2"
                style={{
                  left: `calc(${left}% - 13px)`,
                  backgroundColor: reached ? 'hsl(210 92% 56%)' : 'hsl(228 40% 16%)',
                  borderColor: reached ? 'hsl(199 89% 65%)' : 'hsl(228 30% 26%)',
                  boxShadow: reached ? '0 0 10px hsl(210 92% 56% / 0.7)' : undefined
                }}>

                {reached ?
                <CheckIcon size={13} strokeWidth={3.4} className="text-white" /> :

                <LockIcon size={11} className="text-white/40" />
                }
              </span>);

          })}
        </div>

        <div className="relative mt-3 border-t border-white/[0.08]">
          {quests.map((quest, i) => {
            const done = quest.current >= quest.goal;
            return (
              <div
                key={quest.id}
                className={[
                'flex items-center gap-3 py-3',
                i === quests.length - 1 ? '' : 'border-b border-white/[0.08]'].
                join(' ')}>

                <span
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: done ? 'hsl(142 66% 52% / 0.16)' : 'hsl(224 94% 60% / 0.16)'
                  }}>

                  {done ?
                  <CheckIcon size={15} style={{ color: 'hsl(142 66% 58%)' }} /> :

                  <ZapIcon size={15} style={{ color: 'hsl(210 92% 62%)' }} />
                  }
                </span>
                <span className="min-w-0 flex-1 font-sans text-subhead font-medium text-white/90">
                  {quest.title}
                </span>
                <span className="font-sans text-footnote tabular-nums text-white/45">
                  {quest.current}/{quest.goal}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-2 py-[3px] font-sans text-caption font-bold tabular-nums text-white">
                  <CoinsIcon size={12} style={{ color: GOLD }} />+{quest.reward}
                </span>
              </div>);

          })}
        </div>
      </div>
    </section>);

}

/* ── Tournament, lock, league, shop ────────────────────── */

function TournamentCard({ locked }: {locked: boolean;}) {
  const ui = useUI();
  return (
    <section className="px-4">
      <div className="rounded-card border border-cardborder bg-card p-4">
        <div className="flex items-center gap-3">
          <span
            className={[
            'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]',
            locked ? 'bg-muted' : 'bg-primary/[0.1]'].
            join(' ')}>

            <TrophyIcon size={22} className={locked ? 'text-mutedfg' : 'text-primary'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-headline font-bold text-foreground">{tournament.title}</p>
            <p className="mt-[1px] font-sans text-footnote text-mutedfg">{tournament.subtitle}</p>
            <p className="mt-1 font-sans text-caption font-semibold text-primary">
              {t.tournamentSoon(tournament.date)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3">
          <span className="min-w-0 flex-1 truncate font-sans text-footnote text-mutedfg">
            {tournament.prize}
          </span>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              haptic('success');
              sound.coin();
              ui.toast(t.tournamentJoined, 'success');
            }}
            className={[
            'flex h-[38px] shrink-0 items-center rounded-full px-4 font-sans text-footnote font-bold transition-transform duration-100 ease-out active:scale-[0.96]',
            locked ? 'bg-muted text-mutedfg' : 'bg-primary/[0.1] text-primary'].
            join(' ')}>

            {t.tournamentCta}
          </button>
        </div>
      </div>
    </section>);

}

function LockCard() {
  return (
    <section className="px-4">
      <div className="rounded-card border border-destructive/30 bg-destructive/[0.07] p-5">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-destructive/[0.12]">
            <LockIcon size={26} className="text-destructive" />
          </span>
          <h2 className="mt-3 font-display text-title2 font-bold text-foreground">
            {t.gameLockTitle}
          </h2>
          <p className="mt-2 font-sans text-subhead leading-snug text-foreground/85">
            {t.gameLockBody}
          </p>
          <p className="mt-3 font-sans text-footnote text-mutedfg">{t.gameLockFoot}</p>
        </div>
      </div>
    </section>);

}

function LeagueCard({ locked }: {locked: boolean;}) {
  const ui = useUI();
  return (
    <section className="px-4">
      <button
        type="button"
        disabled={locked}
        onClick={() => {
          sound.tap();
          ui.push({ key: 'game-league', backTitle: t.tabGame, node: <GameLeague /> });
        }}
        className="flex w-full items-center gap-3 rounded-card border border-cardborder bg-card p-4 text-left transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-80 disabled:opacity-50">

        <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-primary/[0.1]">
          <ShieldIcon size={22} className="text-primary" fill="currentColor" fillOpacity={0.15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-headline font-bold text-foreground">{t.leagueName}</p>
          <p className="mt-[2px] font-sans text-subhead text-mutedfg">
            {t.leaguePlace(4)} · 186 XP
          </p>
        </div>
        <ChevronRightIcon size={18} className="shrink-0 text-mutedfg/70" />
      </button>
    </section>);

}

