import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2Icon,
  CheckIcon,
  CoinsIcon,
  FlameIcon,
  HeartIcon,
  StarIcon,
  TargetIcon,
  Volume2Icon,
  XCircleIcon,
  XIcon,
  ZapOffIcon } from
'lucide-react';
import { t } from '../strings';
import { haptic } from '../tokens';
import { sound } from '../sound';
import { gameState } from '../gameData';
import type { PlayQuestion } from '../gameData';

export interface PlayResult {
  xp: number;
  coins: number;
  stars: number;
  correct: number;
  total: number;
}

interface GamePlayProps {
  title: string;
  questions: PlayQuestion[];
  boss?: boolean;
  onClose: () => void;
  onDone: (result: PlayResult) => void;
}

const GOLD = 'hsl(42 96% 50%)';
const CONFETTI_COLORS = ['#3b82f6', '#60a5fa', '#22c55e', '#f5b60b', '#818cf8', '#38bdf8'];

/** star particle directions for the scatter burst */
const SCATTER: [number, number][] = [
[-52, -34], [50, -42], [-64, 6], [62, -2], [-34, -58], [30, -62],
[-46, 30], [44, 26], [0, -70], [-14, 44], [16, 48], [58, 34]];


function useCountUp(target: number, delay: number, tick?: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    let lastTick = 0;
    const step = (now: number) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / 900, 1);
      const next = Math.round(target * (1 - Math.pow(1 - p, 3)));
      setValue((prev) => {
        if (tick && next !== prev && now - lastTick > 75) {
          lastTick = now;
          sound.tick();
        }
        return next;
      });
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const id = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delay);
    const settle = window.setTimeout(() => setValue(target), delay + 1100);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, [target, delay, tick]);
  return value;
}

export function GamePlay({ title, questions, boss, onClose, onDone }: GamePlayProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<null | 'right' | 'wrong'>(null);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [energy, setEnergy] = useState(gameState.energy);
  const [phase, setPhase] = useState<'quiz' | 'results' | 'noenergy'>('quiz');
  const result = useRef<PlayResult | null>(null);

  const question = questions[index];
  const total = questions.length;
  const progress = (index + (checked ? 1 : 0)) / total;
  const story = question.q.length > 26;

  function check() {
    if (selected === null || checked) return;
    if (selected === question.answer) {
      const gained = 10 + combo * 2;
      setChecked('right');
      setCorrect((c) => c + 1);
      setCombo((c) => c + 1);
      setXp((x) => x + gained);
      haptic('success');
      sound.correct();
    } else {
      setChecked('wrong');
      setCombo(0);
      setEnergy((e) => Math.max(0, e - 1));
      gameState.energy = Math.max(0, gameState.energy - 1);
      haptic('warning');
      sound.wrong();
    }
  }

  function finalize(finalCorrect: number, finalXp: number, completed: boolean) {
    const ratio = finalCorrect / total;
    const stars = !completed ? 0 : ratio === 1 ? 3 : ratio >= 0.8 ? 2 : 1;
    const coins = completed ? Math.round((10 + finalCorrect * 3) * (boss ? 2 : 1)) : finalCorrect * 2;
    result.current = { xp: finalXp, coins, stars, correct: finalCorrect, total };
  }

  function next() {
    sound.tap();
    if (checked === 'wrong' && energy === 0) {
      finalize(correct, xp, false);
      setPhase('noenergy');
      return;
    }
    if (index + 1 >= total) {
      finalize(correct, xp, true);
      haptic('success');
      setPhase('results');
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(null);
  }

  function close(deliver: boolean) {
    if (deliver && result.current) onDone(result.current);
    onClose();
  }

  if (phase === 'results' || phase === 'noenergy') {
    return (
      <ResultScreen
        ok={phase === 'results'}
        result={result.current!}
        onFinish={() => close(true)} />);

  }

  return (
    <div className="sheet-up absolute inset-0 z-[65] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 pb-2 pt-[56px]">
        <button
          type="button"
          onClick={() => close(false)}
          aria-label={t.close}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-mutedfg transition-transform duration-100 ease-out active:scale-[0.97]">

          <XIcon size={24} />
        </button>
        <div className="h-[12px] flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progress * 100, 4)}%` }} />

        </div>
        <span className="flex shrink-0 items-center gap-[5px] font-sans text-headline font-bold tabular-nums text-foreground">
          <HeartIcon size={18} className="text-destructive" fill="currentColor" />
          {energy}
        </span>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-[6px] font-sans text-subhead font-bold text-primary">
            {boss && <TargetIcon size={15} />}
            {boss ? `${title} · ${index + 1}/${total}` : t.playQuestionOf(index + 1, total)}
          </p>
          {combo >= 2 && checked !== 'wrong' &&
          <p className="pop-in flex items-center gap-1 font-sans text-footnote font-bold text-primary">
              <FlameIcon size={13} fill="currentColor" fillOpacity={0.3} />
              {t.playCombo(combo)}
            </p>
          }
        </div>

        <div key={index} className="fade-in flex flex-1 flex-col">
          {story ?
          <div className="mt-4 flex items-start gap-3 rounded-card border border-cardborder bg-card p-4">
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] bg-primary">
                <Volume2Icon size={18} className="text-primaryfg" />
              </span>
              <p className="pt-[6px] font-sans text-headline font-semibold leading-snug text-foreground">
                {question.q}
              </p>
            </div> :

          <div className="flex min-h-[130px] items-center justify-center py-6">
              <h2 className="text-center font-display text-[38px] font-bold leading-tight tabular-nums text-foreground">
                {question.q}
              </h2>
            </div>
          }

          <div className={['grid grid-cols-2 gap-3 pb-5', story ? 'mt-5' : ''].join(' ')}>
            {question.options.map((option, i) => {
              const isSelected = selected === i;
              const isAnswer = i === question.answer;
              const showRight = checked && isAnswer;
              const showWrong = checked === 'wrong' && isSelected && !isAnswer;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={checked !== null}
                  onClick={() => {
                    haptic('light');
                    sound.select();
                    setSelected(i);
                  }}
                  className={[
                  'relative flex min-h-[92px] items-center justify-center rounded-[16px] border-2 p-3 font-display font-bold tabular-nums transition-all duration-150 ease-out active:scale-[0.97]',
                  option.length > 9 ? 'text-title3' : 'text-title1',
                  showWrong ?
                  'shake border-destructive bg-destructive/[0.08] text-destructive' :
                  showRight ?
                  'border-good bg-good/[0.08] text-good' :
                  isSelected ?
                  'border-primary bg-primary/[0.06] text-foreground' :
                  'border-cardborder bg-card text-foreground'].
                  join(' ')}>

                  {showRight &&
                  <span className="pop-in absolute left-2 top-2 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-good">
                      <CheckIcon size={14} strokeWidth={3.5} className="text-white" />
                    </span>
                  }
                  {showWrong &&
                  <span className="pop-in absolute left-2 top-2 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-destructive">
                      <XIcon size={14} strokeWidth={3.5} className="text-white" />
                    </span>
                  }
                  {option}
                </button>);

            })}
          </div>
        </div>
      </div>

      <div
        className={[
        'shrink-0 px-4 pb-10 pt-4 transition-colors duration-200',
        checked === 'right' ? 'bg-good/[0.1]' : checked === 'wrong' ? 'bg-destructive/[0.1]' : ''].
        join(' ')}>

        {checked &&
        <div className="slide-up-fade mb-3 flex items-center gap-2">
            {checked === 'right' ?
          <CheckCircle2Icon size={26} className="shrink-0 text-good" /> :

          <XCircleIcon size={26} className="shrink-0 text-destructive" />
          }
            <div className="min-w-0 flex-1">
              <p
              className={[
              'font-sans text-headline font-bold',
              checked === 'right' ? 'text-good' : 'text-destructive'].
              join(' ')}>

                {checked === 'right' ? t.playCorrect : t.playWrong}
              </p>
              {checked === 'wrong' &&
            <p className="font-sans text-subhead text-destructive/90">
                  {t.playAnswerWas(question.options[question.answer])}
                </p>
            }
            </div>
            {checked === 'right' &&
          <span className="pop-in shrink-0 rounded-full bg-good px-3 py-1 font-sans text-subhead font-bold text-white">
                {t.playPlusXp(10 + Math.max(combo - 1, 0) * 2)}
              </span>
          }
          </div>
        }
        {checked ?
        <BigButton tone={checked === 'right' ? 'good' : 'bad'} onClick={next}>
            {t.playContinue}
          </BigButton> :

        <BigButton tone="primary" disabled={selected === null} onClick={check}>
            {t.playCheck}
          </BigButton>
        }
      </div>
    </div>);

}

function BigButton({
  children,
  onClick,
  disabled,
  tone




}: {children: React.ReactNode;onClick: () => void;disabled?: boolean;tone: 'primary' | 'good' | 'bad';}) {
  const tones = {
    primary: 'bg-primary text-primaryfg',
    good: 'bg-good text-white',
    bad: 'bg-destructive text-white'
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
      'flex h-[52px] w-full items-center justify-center rounded-[14px] font-sans text-[17px] font-bold transition-[transform,opacity] duration-100 ease-out active:scale-[0.98]',
      disabled ? 'bg-muted text-mutedfg' : tones[tone]].
      join(' ')}>

      {children}
    </button>);

}

function ResultScreen({
  ok,
  result,
  onFinish



}: {ok: boolean;result: PlayResult;onFinish: () => void;}) {
  const xp = useCountUp(result.xp, 500, true);
  const coins = useCountUp(result.coins, 800, true);
  const accuracy = useCountUp(Math.round(result.correct / result.total * 100), 1100);
  const celebrate = ok && result.stars === 3;

  useEffect(() => {
    if (ok) sound.fanfare();
    const coinTimer = window.setTimeout(() => {
      if (result.coins > 0) sound.coin();
    }, 1750);
    return () => window.clearTimeout(coinTimer);
  }, [ok, result.coins]);

  return (
    <div className="fade-in absolute inset-0 z-[65] flex flex-col bg-background">
      {celebrate &&
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
          {Array.from({ length: 20 }, (_, i) =>
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 137) % 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${i % 8 * 160}ms`,
            ['--drift' as never]: `${(i % 5 - 2) * 34}px`
          }} />

        )}
        </div>
      }

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {ok ?
        <>
            <div className="relative flex items-end gap-3">
              {result.stars > 0 &&
            <span className="pointer-events-none absolute left-1/2 top-1/2">
                  {SCATTER.slice(0, result.stars * 4).map(([dx, dy], i) =>
              <StarIcon
                key={i}
                size={11}
                className="star-scatter absolute"
                style={{
                  animationDelay: `${750 + i * 45}ms`,
                  color: GOLD,
                  fill: GOLD,
                  ['--dx' as never]: `${dx}px`,
                  ['--dy' as never]: `${dy}px`
                }} />

              )}
                </span>
            }
              {[0, 1, 2].map((i) =>
            <StarIcon
              key={i}
              size={i === 1 ? 64 : 44}
              strokeWidth={1.3}
              className={['star-pop', i === 1 ? 'mb-3' : ''].join(' ')}
              style={{
                animationDelay: `${200 + i * 200}ms`,
                color: i < result.stars ? GOLD : 'hsl(var(--muted))',
                fill: i < result.stars ? GOLD : 'hsl(var(--muted))'
              }} />

            )}
            </div>
            <h2
            className="slide-up-fade mt-6 font-display text-title1 font-bold text-foreground"
            style={{ animationDelay: '300ms' }}>

              {result.stars === 3 ? t.playResultsGreat : t.playResultsOk}
            </h2>
          </> :

        <>
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-muted">
              <ZapOffIcon size={40} className="text-mutedfg" />
            </span>
            <h2 className="mt-6 font-display text-title1 font-bold text-foreground">
              {t.playNoEnergyTitle}
            </h2>
            <p className="mt-2 text-center font-sans text-subhead text-mutedfg">
              {t.playNoEnergyBody}
            </p>
          </>
        }

        <div className="mt-9 grid w-full grid-cols-3 gap-3">
          <ResultStat
            label={t.playXp}
            value={`+${xp}`}
            icon={<FlameIcon size={16} className="text-primary" />}
            delay={400} />

          <ResultStat
            label={t.playCoins}
            value={`+${coins}`}
            icon={<CoinsIcon size={16} style={{ color: GOLD }} />}
            delay={550} />

          <ResultStat
            label={t.playAccuracy}
            value={`${accuracy}%`}
            icon={<CheckCircle2Icon size={16} className="text-good" />}
            delay={700} />

        </div>
      </div>

      <div className="shrink-0 px-4 pb-10">
        <BigButton tone="primary" onClick={onFinish}>
          {ok ? t.playContinue : t.playFinish}
        </BigButton>
      </div>
    </div>);

}

function ResultStat({
  label,
  value,
  icon,
  delay




}: {label: string;value: string;icon: React.ReactNode;delay: number;}) {
  return (
    <div
      className="slide-up-fade flex flex-col items-center rounded-card border border-cardborder bg-card px-2 py-4"
      style={{ animationDelay: `${delay}ms` }}>

      <span className="flex items-center gap-1 font-sans text-caption font-medium uppercase tracking-[0.4px] text-mutedfg">
        {icon}
        {label}
      </span>
      <span className="mt-1 font-display text-title2 font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>);

}
