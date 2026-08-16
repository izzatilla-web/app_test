import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CoinsIcon, TimerIcon, TrophyIcon, XIcon, ZapIcon } from 'lucide-react';
import { t } from '../strings';
import { haptic } from '../tokens';
import { sound } from '../sound';
import { gameState, sprintPool } from '../gameData';

const GOLD = 'hsl(42 96% 50%)';
const TOTAL_TENTHS = 600;

interface SprintPlayProps {
  onClose: () => void;
  onFinished: () => void;
}

export function SprintPlay({ onClose, onFinished }: SprintPlayProps) {
  const [round, setRound] = useState(0);
  const pool = useMemo(() => sprintPool(Math.floor(Math.random() * 30)), [round]);
  const [tenths, setTenths] = useState(TOTAL_TENTHS);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState<null | 'right' | 'wrong'>(null);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const rewarded = useRef(false);

  const question = pool[index % pool.length];

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => {
      setTenths((v) => {
        if (v <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return v - 1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, round]);

  useEffect(() => {
    if (tenths === 0 && phase === 'play') {
      setPhase('done');
      sound.fanfare();
      if (!rewarded.current) {
        rewarded.current = true;
        gameState.coins += correct;
        gameState.xp += correct * 2;
        if (correct > gameState.sprintBest) gameState.sprintBest = correct;
      }
    }
  }, [tenths, phase, correct]);

  function answer(i: number) {
    if (flash || tenths === 0) return;
    const right = i === question.answer;
    if (right) {
      setCorrect((c) => c + 1);
      haptic('light');
      sound.tick();
    } else {
      haptic('warning');
      sound.wrong();
    }
    setFlash(right ? 'right' : 'wrong');
    window.setTimeout(() => {
      setFlash(null);
      setIndex((v) => v + 1);
    }, right ? 120 : 350);
  }

  function restart() {
    rewarded.current = false;
    setRound((r) => r + 1);
    setTenths(TOTAL_TENTHS);
    setIndex(0);
    setCorrect(0);
    setFlash(null);
    setPhase('play');
    sound.tap();
  }

  if (phase === 'done') {
    const isRecord = correct >= gameState.sprintBest && correct > 0;
    return (
      <div className="fade-in absolute inset-0 z-[65] flex flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <span
            className={['flex h-[92px] w-[92px] items-center justify-center rounded-full', isRecord ? 'bg-primary glow-pulse' : 'bg-primary/[0.08]'].join(' ')}>

            <TrophyIcon size={40} className={isRecord ? 'text-primaryfg' : 'text-primary'} />
          </span>
          <h2 className="mt-5 font-display text-title1 font-bold text-foreground">
            {isRecord ? t.sprintNewRecord : t.sprintTimeUp}
          </h2>
          <p className="pop-in mt-4 font-display text-[64px] font-bold tabular-nums text-primary">
            {correct}
          </p>
          <p className="font-sans text-subhead text-mutedfg">{t.sprintScore}</p>
          <div className="mt-6 flex items-center gap-4 font-sans text-subhead font-semibold text-foreground">
            <span className="flex items-center gap-1">
              <TrophyIcon size={15} className="text-mutedfg" />
              {t.sprintBest(gameState.sprintBest)}
            </span>
            <span className="text-mutedfg">·</span>
            <span className="flex items-center gap-1">
              <CoinsIcon size={15} style={{ color: GOLD }} />+{correct}
            </span>
          </div>
        </div>
        <div className="shrink-0 space-y-3 px-4 pb-10">
          <button
            type="button"
            onClick={restart}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary font-sans text-[17px] font-bold text-primaryfg transition-transform duration-100 ease-out active:scale-[0.98]">

            <ZapIcon size={18} />
            {t.sprintGo}
          </button>
          <button
            type="button"
            onClick={() => {
              onFinished();
              onClose();
            }}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-primary/[0.08] font-sans text-[17px] font-bold text-primary transition-transform duration-100 ease-out active:scale-[0.98]">

            {t.playFinish}
          </button>
        </div>
      </div>);

  }

  const seconds = Math.ceil(tenths / 10);
  const low = tenths <= 100;

  return (
    <div className="sheet-up absolute inset-0 z-[65] flex flex-col bg-background">
      <div className="h-[5px] w-full bg-muted">
        <div
          className={['h-full rounded-r-full transition-[width] duration-100 ease-linear', low ? 'bg-destructive' : 'bg-primary'].join(' ')}
          style={{ width: `${tenths / TOTAL_TENTHS * 100}%` }} />

      </div>
      <div className="flex items-center gap-3 px-4 pb-2 pt-[52px]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-mutedfg transition-transform duration-100 ease-out active:scale-[0.97]">

          <XIcon size={24} />
        </button>
        <span className="flex items-center gap-[6px] font-sans text-headline font-bold text-primary">
          <ZapIcon size={17} fill="currentColor" fillOpacity={0.25} />
          {t.sprintTitle}
        </span>
        <span className="flex-1" />
        <span
          className={['flex items-center gap-1 font-display text-title2 font-bold tabular-nums', low ? 'text-destructive' : 'text-foreground'].join(' ')}>

          <TimerIcon size={18} className={low ? 'text-destructive' : 'text-mutedfg'} />
          {seconds}
        </span>
      </div>

      <div className="flex items-center justify-between px-4">
        <span key={correct} className="pop-in font-display text-title1 font-bold tabular-nums text-foreground">
          {correct}
        </span>
        <span className="font-sans text-footnote text-mutedfg">{t.sprintBest(gameState.sprintBest)}</span>
      </div>

      <div key={index} className="flex min-h-0 flex-1 flex-col px-4">
        <div className="flex min-h-[100px] items-center justify-center py-4">
          <h2
            className={[
            'text-center font-display font-bold leading-tight tabular-nums text-foreground',
            question.q.length > 26 ? 'text-title3' : 'text-[36px]'].
            join(' ')}>

            {question.q}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 pb-6">
          {question.options.map((option, i) => {
            const showRight = flash === 'right' && i === question.answer;
            const showWrong = flash === 'wrong' && i === question.answer;
            return (
              <button
                key={`${index}-${option}`}
                type="button"
                onClick={() => answer(i)}
                className={[
                'flex min-h-[80px] items-center justify-center rounded-[16px] border-2 p-3 font-display font-bold tabular-nums transition-all duration-100 ease-out active:scale-[0.97]',
                option.length > 9 ? 'text-headline' : 'text-title2',
                showRight ?
                'border-good bg-good/[0.1] text-good' :
                showWrong ?
                'border-good bg-good/[0.08] text-good' :
                'border-cardborder bg-card text-foreground'].
                join(' ')}>

                {option}
              </button>);

          })}
        </div>
      </div>
    </div>);

}
