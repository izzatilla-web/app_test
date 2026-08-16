import React from 'react';
import { ScaleIcon, ShuffleIcon, SwordsIcon, UsersIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { LevelRing } from '../components/LevelRing';
import { BattleLobby } from './BattleLobby';
import { t } from '../strings';
import { haptic } from '../tokens';
import { sound } from '../sound';
import { gameState, playerLevel, xpIntoLevel, XP_PER_LEVEL } from '../gameData';
import type { BattleMode } from '../gameData';
import { useUI } from '../ui';

export function BattleEntry({ onChanged }: {onChanged: () => void;}) {
  const ui = useUI();
  const level = playerLevel();

  function join(mode: BattleMode) {
    haptic('light');
    sound.tap();
    ui.openFullScreen(
      <BattleLobby
        mode={mode}
        onClose={ui.closeFullScreen}
        onFinished={onChanged} />

    );
  }

  return (
    <PushScreen title={t.battleTitle} backTitle={t.tabGame} onBack={ui.pop}>
      <div className="space-y-6 px-4 pt-2">
        <div className="flex items-center gap-3 rounded-card border border-cardborder bg-card p-4">
          <LevelRing level={level} progress={xpIntoLevel() / XP_PER_LEVEL} />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-footnote text-mutedfg">{t.battleYourLevel}</p>
            <p className="font-sans text-headline font-bold text-foreground">
              {t.arenaLevel(level)}
            </p>
          </div>
          <span className="flex items-center gap-[6px] rounded-full bg-primary/[0.08] px-3 py-[6px] font-sans text-footnote font-bold tabular-nums text-primary">
            <SwordsIcon size={14} />
            {t.battleStats(gameState.battleWins, gameState.battlePlayed)}
          </span>
        </div>

        <h2 className="px-1 font-display text-title3 font-bold text-foreground">
          {t.battleModeQuestion}
        </h2>

        <ModeCard
          icon={ScaleIcon}
          title={t.battleSameTitle}
          body={t.battleSameBody}
          primary
          onJoin={() => join('same')} />


        <ModeCard
          icon={ShuffleIcon}
          title={t.battleMixedTitle}
          body={t.battleMixedBody}
          onJoin={() => join('mixed')} />


        <p className="flex items-center justify-center gap-2 pb-4 font-sans text-footnote text-mutedfg">
          <UsersIcon size={14} />
          {t.battleHeroBody}
        </p>
      </div>
    </PushScreen>);

}

function ModeCard({
  icon: Icon,
  title,
  body,
  primary,
  onJoin





}: {icon: typeof ScaleIcon;title: string;body: string;primary?: boolean;onJoin: () => void;}) {
  return (
    <div
      className={[
      'rounded-card border p-4',
      primary ? 'border-primary/40 bg-primary/[0.05]' : 'border-cardborder bg-card'].
      join(' ')}>

      <div className="flex items-start gap-3">
        <span
          className={[
          'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]',
          primary ? 'bg-primary' : 'bg-primary/[0.1]'].
          join(' ')}>

          <Icon size={22} className={primary ? 'text-primaryfg' : 'text-primary'} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-headline font-bold text-foreground">{title}</h3>
          <p className="mt-1 font-sans text-subhead leading-snug text-mutedfg">{body}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onJoin}
        className={[
        'mt-4 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] font-sans text-[16px] font-bold transition-[transform,opacity] duration-100 ease-out active:scale-[0.98]',
        primary ? 'bg-primary text-primaryfg' : 'bg-primary/[0.1] text-primary'].
        join(' ')}>

        <SwordsIcon size={18} />
        {t.battleFind}
      </button>
    </div>);

}
