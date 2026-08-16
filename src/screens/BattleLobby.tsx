import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckIcon,
  CoinsIcon,
  Loader2Icon,
  LockIcon,
  MedalIcon,
  RadioIcon,
  ScaleIcon,
  ShuffleIcon,
  SwordsIcon,
  XIcon } from
'lucide-react';
import { Avatar } from '../components/Avatar';
import { LevelRing } from '../components/LevelRing';
import { t } from '../strings';
import { haptic } from '../tokens';
import { sound } from '../sound';
import {
  BATTLE_QUESTIONS,
  BATTLE_REWARDS,
  BATTLE_SECONDS,
  BATTLE_SIZE,
  BOT_NAMES,
  battlePool,
  gameState,
  playerLevel,
  xpIntoLevel,
  XP_PER_LEVEL } from
'../gameData';
import type { BattleMode, BattlePlayer } from '../gameData';

type Phase = 'searching' | 'lobby' | 'countdown' | 'battle' | 'results';

interface BattleLobbyProps {
  mode: BattleMode;
  onClose: () => void;
  onFinished: () => void;
}

const GOLD = 'hsl(42 96% 50%)';
const MEDAL_COLORS = ['hsl(42 80% 48%)', 'hsl(215 14% 55%)', 'hsl(24 45% 48%)'];

function makeBot(id: number, name: string, mode: BattleMode, myLevel: number): BattlePlayer {
  const level =
  mode === 'same' ?
  myLevel :
  Math.max(1, myLevel - 3 + Math.floor(Math.random() * 8));
  return {
    id,
    name,
    level,
    skill: Math.min(0.85, 0.3 + level * 0.05),
    score: 0
  };
}

export function BattleLobby({ mode, onClose, onFinished }: BattleLobbyProps) {
  const myLevel = playerLevel();
  const you = useMemo<BattlePlayer>(
    () => ({ id: 0, name: t.battleYou, level: myLevel, skill: 1, you: true, score: 0 }),
    [myLevel]
  );

  const [phase, setPhase] = useState<Phase>('searching');
  const [searchNote, setSearchNote] = useState('');
  const [eventNo, setEventNo] = useState(0);
  const [players, setPlayers] = useState<BattlePlayer[]>([]);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const [feed, setFeed] = useState('');
  const [count, setCount] = useState<number | 'START'>(3);

  const timers = useRef<number[]>([]);
  const namePool = useRef<string[]>([...BOT_NAMES].sort(() => Math.random() - 0.5));
  const nextBotId = useRef(1);
  const leaveDone = useRef(false);
  const rewarded = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function takeBot(): BattlePlayer {
    const name = namePool.current.shift() ?? `O'yinchi ${nextBotId.current}`;
    return makeBot(nextBotId.current++, name, mode, myLevel);
  }

  /* ── matchmaking simulation ── */
  useEffect(() => {
    const no = 100 + Math.floor(Math.random() * 900);
    setEventNo(no);
    const roll = Math.random();

    const enterLobby = (initialBots: number, note: string) => {
      later(() => {
        setSearchNote(note);
        later(() => {
          setPlayers([...Array.from({ length: initialBots }, takeBot), you]);
          setPhase('lobby');
        }, 900);
      }, 900);
    };

    if (roll < 0.2) {
      later(() => setSearchNote(t.battleFullSkip), 700);
      later(() => {
        setSearchNote(t.battleCreatedEvent(no));
        later(() => {
          setPlayers([you]);
          setPhase('lobby');
        }, 900);
      }, 1700);
    } else if (roll < 0.65) {
      enterLobby(4 + Math.floor(Math.random() * 4), t.battleFoundEvent(no));
    } else {
      enterLobby(0, t.battleCreatedEvent(no));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── lobby fill simulation ── */
  useEffect(() => {
    if (phase !== 'lobby') return;
    if (players.length >= BATTLE_SIZE) {
      later(() => {
        haptic('success');
        sound.whoosh();
        setPhase('countdown');
      }, 900);
      return;
    }
    if (players.length === 8 && !leaveDone.current) {
      leaveDone.current = true;
      later(() => {
        const bot = players.find((p) => !p.you);
        if (!bot) return;
        setLeavingId(bot.id);
        setFeed(t.battleLeft(bot.name));
        later(() => {
          setLeavingId(null);
          setPlayers((prev) => prev.filter((p) => p.id !== bot.id));
        }, 280);
      }, 700);
      return;
    }
    later(() => {
      const bot = takeBot();
      sound.join();
      setFeed(t.battleJoined(bot.name));
      setPlayers((prev) =>
      prev.length >= BATTLE_SIZE ? prev : [...prev.filter((p) => !p.you), bot, ...prev.filter((p) => p.you)]
      );
    }, 650 + Math.random() * 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, players]);

  /* ── countdown ── */
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCount(3);
    sound.beep();
    later(() => {
      setCount(2);
      sound.beep();
    }, 900);
    later(() => {
      setCount(1);
      sound.beep();
    }, 1800);
    later(() => {
      setCount('START');
      haptic('success');
      sound.start();
    }, 2700);
    later(() => setPhase('battle'), 3600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const filled = players.length;
  const almost = filled >= 8 && filled < BATTLE_SIZE;
  const full = filled >= BATTLE_SIZE;

  if (phase === 'battle') {
    return (
      <BattleRound
        mode={mode}
        players={players}
        setPlayers={setPlayers}
        onDone={() => setPhase('results')} />);

  }

  if (phase === 'results') {
    return (
      <BattleResults
        players={players}
        rewarded={rewarded}
        onExit={() => {
          onFinished();
          onClose();
        }} />);

  }

  return (
    <div className="sheet-up absolute inset-0 z-[65] flex flex-col bg-background">
      {/* header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-[56px]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.battleLeave}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-mutedfg transition-transform duration-100 ease-out active:scale-[0.97]">

          <XIcon size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-sans text-headline font-bold text-foreground">
            {mode === 'same' ? <ScaleIcon size={16} className="text-primary" /> : <ShuffleIcon size={16} className="text-primary" />}
            {mode === 'same' ? t.battleSameTitle : t.battleMixedTitle}
          </p>
          {eventNo > 0 && phase === 'lobby' &&
          <p className="font-sans text-footnote tabular-nums text-mutedfg">№{eventNo}</p>
          }
        </div>
        <LevelRing level={myLevel} progress={xpIntoLevel() / XP_PER_LEVEL} size={40} />
      </div>

      {phase === 'searching' ?
      <div className="flex flex-1 flex-col items-center justify-center px-8">
          <span className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-primary/[0.08]">
            <Loader2Icon size={32} className="animate-spin text-primary" />
          </span>
          <h2 className="mt-5 font-display text-title2 font-bold text-foreground">
            {t.battleSearching}
          </h2>
          {searchNote &&
        <p className="fade-in mt-2 text-center font-sans text-subhead text-mutedfg">
              {searchNote}
            </p>
        }
        </div> :

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
          {/* status */}
          <div className="flex flex-col items-center pb-5 pt-2">
            {full ?
          <span className="pop-in flex items-center gap-[5px] rounded-full bg-good/[0.12] px-3 py-[5px] font-sans text-caption font-bold tracking-[0.5px] text-good">
                <CheckIcon size={12} strokeWidth={3.2} />
                {t.battleFullPill}
              </span> :
          almost ?
          <span className="pop-in rounded-full bg-warn/[0.14] px-3 py-[5px] font-sans text-caption font-bold tracking-[0.5px] text-warn">
                {t.battleAlmost}
              </span> :

          <span className="flex items-baseline font-sans text-subhead font-semibold text-mutedfg">
                {t.battleWaiting}
                {[0, 1, 2].map((i) =>
            <span
              key={i}
              className="dot-blink font-bold"
              style={{ animationDelay: `${i * 220}ms` }}>

                    .
                  </span>
            )}
              </span>
          }
            <p
            key={filled}
            className={['pop-in mt-3 font-display font-bold tabular-nums text-foreground', almost ? 'text-[54px]' : 'text-[46px]'].join(' ')}>

              {filled}
              <span className="text-mutedfg">/{BATTLE_SIZE}</span>
            </p>
            <div className="mt-2 h-[8px] w-[200px] overflow-hidden rounded-full bg-muted">
              <div
              className={[
              'h-full rounded-full transition-[width,background-color] duration-500 ease-out',
              full ? 'bg-good' : 'bg-primary',
              almost || full ? 'glow-pulse' : ''].
              join(' ')}
              style={{ width: `${filled / BATTLE_SIZE * 100}%` }} />

            </div>
            <p className="mt-3 font-sans text-subhead text-mutedfg">
              {full ?
            t.battleLocked :
            t.battleNeedMore(BATTLE_SIZE - filled)}
            </p>
            {!full &&
          <p className="mt-1 font-sans text-footnote text-mutedfg/70">
                {almost ? t.battleStartsVerySoon : t.battleStartsSoon}
              </p>
          }
            {feed && !full &&
          <p key={feed} className="fade-in mt-2 font-sans text-footnote font-medium text-primary">
                {feed}
              </p>
          }
          </div>

          {/* 10 slots */}
          <div className="grid grid-cols-5 gap-x-2 gap-y-4">
            {Array.from({ length: BATTLE_SIZE }, (_, i) => {
            const player = players[i];
            if (!player) {
              return (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-[6px]">
                    <span className="slot-pulse flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-dashed border-cardborder bg-muted/40" />
                    <span className="font-sans text-[10px] text-mutedfg/70">{t.battleWaiting}</span>
                  </div>);

            }
            return (
              <div
                key={player.id}
                className={['flex flex-col items-center gap-[6px]', player.id === leavingId ? 'slot-out' : 'join-in'].join(' ')}>

                  <span className="relative">
                    <span
                    className={[
                    'block rounded-full',
                    player.you ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''].
                    join(' ')}>

                      <Avatar name={player.name} seed={player.id + 5} size={40} />
                    </span>
                    <span
                    className="slide-up-fade absolute -bottom-[4px] left-1/2 flex h-[16px] -translate-x-1/2 items-center rounded-full border border-cardborder bg-card px-[5px] font-sans text-[9px] font-bold tabular-nums text-primary"
                    style={{ animationDelay: '140ms' }}>

                      {t.levelShort(player.level)}
                    </span>
                  </span>
                  <span
                  className={[
                  'slide-up-fade max-w-[62px] truncate font-sans text-[10px]',
                  player.you ? 'font-bold text-primary' : 'text-mutedfg'].
                  join(' ')}
                  style={{ animationDelay: '220ms' }}>

                    {player.you ? t.battleYou : player.name.split(' ')[0]}
                  </span>
                </div>);

          })}
          </div>

          {full &&
        <div className="mt-6 flex items-center justify-center gap-2 rounded-card border border-cardborder bg-card px-4 py-3">
              <LockIcon size={14} className="text-mutedfg" />
              <span className="font-sans text-footnote text-mutedfg">{t.battleLocked}</span>
            </div>
        }
        </div>
      }

      {/* countdown overlay */}
      {phase === 'countdown' &&
      <div className="absolute inset-0 z-[70] flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div key={String(count)} className="count-zoom flex flex-col items-center">
            {count === 'START' ?
          <>
                <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-primary glow-pulse">
                  <SwordsIcon size={48} className="text-primaryfg" />
                </span>
                <p className="mt-5 font-display text-[44px] font-bold tracking-[2px] text-primary">
                  {t.battleStart}
                </p>
              </> :

          <>
                <p className="font-display text-[120px] font-bold tabular-nums text-foreground">
                  {count}
                </p>
                <p className="font-sans text-headline font-semibold text-mutedfg">
                  {t.battleGetReady}
                </p>
              </>
          }
          </div>
        </div>
      }
    </div>);

}

/* ── the live round ────────────────────────────────────── */

function BattleRound({
  mode,
  players,
  setPlayers,
  onDone





}: {mode: BattleMode;players: BattlePlayer[];setPlayers: React.Dispatch<React.SetStateAction<BattlePlayer[]>>;onDone: () => void;}) {
  const questions = useMemo(() => battlePool(mode), [mode]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<null | 'right' | 'wrong'>(null);
  const [tenths, setTenths] = useState(BATTLE_SECONDS * 10);
  const timers = useRef<number[]>([]);
  const ticker = useRef<number | null>(null);

  const question = questions[index];
  const you = players.find((p) => p.you)!;
  const standings = [...players].sort((a, b) => b.score - a.score);
  const myRank = standings.findIndex((p) => p.you) + 1;
  const leader = standings[0];

  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout);
    if (ticker.current) window.clearInterval(ticker.current);
  }, []);

  useEffect(() => {
    setTenths(BATTLE_SECONDS * 10);
    setSelected(null);
    setChecked(null);
    ticker.current = window.setInterval(() => {
      setTenths((v) => {
        if (v <= 1) {
          if (ticker.current) window.clearInterval(ticker.current);
          return 0;
        }
        return v - 1;
      });
    }, 100);
    return () => {
      if (ticker.current) window.clearInterval(ticker.current);
    };
  }, [index]);

  const advance = useCallback(() => {
    setPlayers((prev) =>
    prev.map((p) =>
    p.you ?
    p :
    {
      ...p,
      score: p.score + (Math.random() < p.skill ? 100 + Math.floor(Math.random() * 40) : 0)
    }
    )
    );
    if (index + 1 >= BATTLE_QUESTIONS) {
      timers.current.push(window.setTimeout(onDone, 600));
    } else {
      timers.current.push(window.setTimeout(() => setIndex((i) => i + 1), 300));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (tenths === 0 && checked === null) {
      setChecked('wrong');
      haptic('warning');
      sound.wrong();
      timers.current.push(window.setTimeout(advance, 1000));
    }
  }, [tenths, checked, advance]);

  function answer(i: number) {
    if (checked !== null) return;
    if (ticker.current) window.clearInterval(ticker.current);
    setSelected(i);
    const right = i === question.answer;
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const bonus = Math.round(tenths / 10) * 5;
      setPlayers((prev) =>
      prev.map((p) => p.you ? { ...p, score: p.score + 100 + bonus } : p)
      );
      haptic('success');
      sound.correct();
    } else {
      haptic('warning');
      sound.wrong();
    }
    timers.current.push(window.setTimeout(advance, 1000));
  }

  return (
    <div className="fade-in absolute inset-0 z-[65] flex flex-col bg-background">
      {/* timer bar */}
      <div className="h-[5px] w-full bg-muted">
        <div
          className={['h-full rounded-r-full transition-[width] duration-100 ease-linear', tenths <= 30 ? 'bg-destructive' : 'bg-primary'].join(' ')}
          style={{ width: `${tenths / (BATTLE_SECONDS * 10) * 100}%` }} />

      </div>

      {/* live strip */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-[52px]">
        <span className="flex items-center gap-[5px] rounded-full bg-destructive/[0.1] px-2 py-[3px] font-sans text-[10px] font-bold tracking-[0.6px] text-destructive">
          <RadioIcon size={11} className="slot-pulse" />
          {t.battleLive}
        </span>
        <span className="font-sans text-subhead font-bold text-primary">
          {index + 1}/{BATTLE_QUESTIONS}
        </span>
        <span className="min-w-0 flex-1 truncate text-right font-sans text-footnote tabular-nums text-mutedfg">
          {leader.you ? t.battleYou : leader.name.split(' ')[0]} · {leader.score}
        </span>
        <span
          key={myRank}
          className="pop-in rounded-full bg-primary px-3 py-[5px] font-sans text-footnote font-bold tabular-nums text-primaryfg">

          {t.battleRank(myRank)}
        </span>
      </div>

      <div className="flex items-baseline justify-between px-4">
        <span className="font-display text-title2 font-bold tabular-nums text-foreground">
          {you.score} <span className="text-footnote font-semibold text-mutedfg">{t.battleScoreUnit}</span>
        </span>
        <span
          className={['font-display text-title3 font-bold tabular-nums', tenths <= 30 ? 'text-destructive' : 'text-mutedfg'].join(' ')}>

          {Math.ceil(tenths / 10)}
        </span>
      </div>

      <div key={index} className="fade-in flex min-h-0 flex-1 flex-col px-4">
        <div className="flex min-h-[110px] items-center justify-center py-4">
          <h2
            className={[
            'text-center font-display font-bold leading-tight tabular-nums text-foreground',
            question.q.length > 26 ? 'text-title3' : 'text-[34px]'].
            join(' ')}>

            {question.q}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-6">
          {question.options.map((option, i) => {
            const isAnswer = i === question.answer;
            const showRight = checked && isAnswer;
            const showWrong = checked === 'wrong' && selected === i && !isAnswer;
            return (
              <button
                key={option}
                type="button"
                disabled={checked !== null}
                onClick={() => answer(i)}
                className={[
                'relative flex min-h-[84px] items-center justify-center rounded-[16px] border-2 p-3 font-display font-bold tabular-nums transition-all duration-150 ease-out active:scale-[0.97]',
                option.length > 9 ? 'text-headline' : 'text-title2',
                showWrong ?
                'shake border-destructive bg-destructive/[0.08] text-destructive' :
                showRight ?
                'border-good bg-good/[0.08] text-good' :
                'border-cardborder bg-card text-foreground'].
                join(' ')}>

                {showRight &&
                <span className="pop-in absolute left-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-good">
                    <CheckIcon size={13} strokeWidth={3.5} className="text-white" />
                  </span>
                }
                {showWrong &&
                <span className="pop-in absolute left-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-destructive">
                    <XIcon size={13} strokeWidth={3.5} className="text-white" />
                  </span>
                }
                {option}
              </button>);

          })}
        </div>
      </div>
    </div>);

}

/* ── results ───────────────────────────────────────────── */

function BattleResults({
  players,
  rewarded,
  onExit




}: {players: BattlePlayer[];rewarded: React.MutableRefObject<boolean>;onExit: () => void;}) {
  const standings = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const myRank = standings.findIndex((p) => p.you) + 1;
  const me = standings[myRank - 1];
  const coins = BATTLE_REWARDS[Math.min(myRank - 1, BATTLE_REWARDS.length - 1)];
  const xp = Math.round(me.score / 10);

  useEffect(() => {
    sound.fanfare();
    if (!rewarded.current) {
      rewarded.current = true;
      gameState.coins += coins;
      gameState.xp += xp;
      gameState.battlePlayed += 1;
      if (myRank === 1) gameState.battleWins += 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fade-in absolute inset-0 z-[65] flex flex-col bg-background">
      <div className="px-4 pb-2 pt-[64px] text-center">
        <h2 className="font-display text-title1 font-bold text-foreground">
          {t.battleResultsTitle}
        </h2>
        <p className="pop-in mt-3 font-display text-[46px] font-bold tabular-nums text-primary">
          {t.battleRank(myRank)}
        </p>
        <div className="mt-2 flex items-center justify-center gap-3 font-sans text-subhead font-semibold text-foreground">
          <span className="flex items-center gap-1">
            <CoinsIcon size={16} style={{ color: GOLD }} />+{coins}
          </span>
          <span className="text-mutedfg">·</span>
          <span>+{xp} XP</span>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-4">
        <div className="overflow-hidden rounded-card border border-cardborder bg-card">
          {standings.map((player, i) =>
          <div
            key={player.id}
            className={[
            'slide-up-fade flex items-center gap-3 px-4 py-[10px]',
            i === standings.length - 1 ? '' : 'border-b border-hairline',
            player.you ? 'bg-primary/[0.06]' : ''].
            join(' ')}
            style={{ animationDelay: `${i * 60}ms` }}>

              <span className="flex w-[26px] shrink-0 items-center justify-center">
                {i < 3 ?
              <MedalIcon size={17} style={{ color: MEDAL_COLORS[i] }} /> :

              <span className="font-sans text-subhead font-bold tabular-nums text-mutedfg">
                    {i + 1}
                  </span>
              }
              </span>
              <Avatar name={player.name} seed={player.id + 5} size={32} />
              <span
              className={[
              'min-w-0 flex-1 truncate font-sans text-subhead',
              player.you ? 'font-bold text-primary' : 'font-medium text-foreground'].
              join(' ')}>

                {player.you ? t.battleYou : player.name}
                <span className="ml-2 font-sans text-[10px] font-bold text-mutedfg">
                  {t.levelShort(player.level)}
                </span>
              </span>
              <span className="shrink-0 font-sans text-subhead font-bold tabular-nums text-foreground">
                {player.score}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-10 pt-4">
        <button
          type="button"
          onClick={onExit}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-primary font-sans text-[17px] font-bold text-primaryfg transition-transform duration-100 ease-out active:scale-[0.98]">

          {t.battleExit}
        </button>
      </div>
    </div>);

}
