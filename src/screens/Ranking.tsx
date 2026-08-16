import { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TrophyIcon } from
'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { SegmentedControl } from '../components/SegmentedControl';
import { EmptyState } from '../components/EmptyState';
import { t } from '../strings';
import { haptic } from '../tokens';
import { SCORE_WEIGHTS, weakestModules } from '../academics';
import { curriculumFor } from '../curriculum';
import {
  buildRanking,
  byImprovement,
  myRow,
  RANKING_MIN_EXAMS,
  rowAhead } from
'../ranking';
import type { RankingScope, RankRow } from '../ranking';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';

/**
 * Academic ranking. Purely educational — students are ordered by the composite
 * academic score (mastery, exams, homework, curriculum, attendance), never by a
 * single metric and never by anything from the Games system.
 */
export function Ranking({ child, backTitle }: {child: ChildRecord;backTitle: string;}) {
  const ui = useUI();
  const [scopeIndex, setScopeIndex] = useState(0);
  const [modeIndex, setModeIndex] = useState(0);
  const [formulaOpen, setFormulaOpen] = useState(false);

  const scope: RankingScope = scopeIndex === 0 ? 'level' : 'all';
  const performance = useMemo(() => buildRanking(child, scope), [child, scope]);
  const rows = modeIndex === 0 ? performance : byImprovement(performance);
  // The improvement list only holds students with score history, so the
  // student may be absent from it — their performance row always exists.
  const mine = myRow(rows);
  const myPerformance = myRow(performance);

  // A ranking built on one exam would be noise, so say so instead.
  if (child.exams.length < RANKING_MIN_EXAMS) {
    return (
      <PushScreen title={t.rankingTitle} backTitle={backTitle} onBack={ui.pop}>
        <EmptyState icon={TrophyIcon} title={t.rankEmptyTitle} body={t.rankEmptyBody} />
      </PushScreen>);

  }

  const podium = modeIndex === 0 ? performance.slice(0, 3) : [];
  const listRows = modeIndex === 0 ? rows.slice(3) : rows;

  return (
    <PushScreen title={t.rankingTitle} backTitle={backTitle} onBack={ui.pop}>
      <div className="space-y-8 pb-4">
        <div className="space-y-3 px-4 pt-1">
          <p className="font-sans text-subhead text-mutedfg">{t.rankingSubtitle}</p>
          <SegmentedControl
            options={[t.rankScopeLevel, t.rankScopeAll]}
            value={scopeIndex}
            onChange={setScopeIndex} />

          <SegmentedControl
            options={[t.rankModePerformance, t.rankModeImprovement]}
            value={modeIndex}
            onChange={setModeIndex} />

        </div>

        {podium.length === 3 && <Podium rows={podium} />}

        {mine ?
        <MyPosition row={mine} improvement={modeIndex === 1} /> :

        <section className="px-4">
            <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
              {t.rankYourPosition}
            </h2>
            <Card>
              <p className="font-sans text-subhead text-mutedfg">{t.rankNoHistory}</p>
            </Card>
          </section>
        }

        {myPerformance &&
        <section className="px-4">
            <Card padded={false}>
              <button
              type="button"
              onClick={() => {
                haptic('light');
                setFormulaOpen((open) => !open);
              }}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-opacity duration-100 ease-out active:opacity-70">

                <span className="font-sans text-headline font-semibold text-foreground">
                  {t.rankHowCalculated}
                </span>
                <ChevronDownIcon
                size={18}
                className="shrink-0 text-mutedfg transition-transform duration-250 ease-out"
                style={{ transform: formulaOpen ? 'rotate(180deg)' : 'none' }} />

              </button>
              {formulaOpen &&
            <div className="slide-up-fade border-t border-hairline p-4">
                  <p className="font-sans text-subhead text-mutedfg">{t.rankFormulaIntro}</p>
                  <div className="mt-3 space-y-3">
                    <ComponentBar
                  label={t.rankComponentMastery}
                  value={myPerformance.components.mastery}
                  weight={SCORE_WEIGHTS.mastery} />

                    <ComponentBar
                  label={t.rankComponentExams}
                  value={myPerformance.components.exams}
                  weight={SCORE_WEIGHTS.exams} />

                    <ComponentBar
                  label={t.rankComponentHomework}
                  value={myPerformance.components.homework}
                  weight={SCORE_WEIGHTS.homework} />

                    <ComponentBar
                  label={t.rankComponentCurriculum}
                  value={myPerformance.components.curriculum}
                  weight={SCORE_WEIGHTS.curriculum} />

                    <ComponentBar
                  label={t.rankComponentConsistency}
                  value={myPerformance.components.consistency}
                  weight={SCORE_WEIGHTS.consistency} />

                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
                    <span className="font-sans text-subhead text-mutedfg">{t.rankScore}</span>
                    <span className="font-display text-title2 font-bold tabular-nums text-foreground">
                      {myPerformance.score.toFixed(1)}
                    </span>
                  </div>
                </div>
            }
            </Card>
          </section>
        }

        <section className="px-4">
          <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
            {t.rankTopStudents}
          </h2>
          <Card padded={false}>
            {listRows.map((row, i) =>
            <RankRowView key={row.id} row={row} last={i === listRows.length - 1} improvement={modeIndex === 1} />
            )}
          </Card>
        </section>

        {modeIndex === 0 && myPerformance &&
        <HowToImprove rows={performance} mine={myPerformance} child={child} />
        }
      </div>
    </PushScreen>);

}

/* ── Top three ─────────────────────────────────────────── */

function Podium({ rows }: {rows: RankRow[];}) {
  // Visual order puts the leader in the middle: #2, #1, #3.
  const order = [rows[1], rows[0], rows[2]];
  return (
    <section className="px-4">
      <div className="flex items-end justify-center gap-3">
        {order.map((row, i) => {
          const first = i === 1;
          return (
            <div
              key={row.id}
              className="slide-up-fade flex min-w-0 flex-1 flex-col items-center"
              style={{ animationDelay: `${i * 70}ms` }}>

              <div className="relative">
                <span
                  className="block rounded-full"
                  style={{
                    padding: first ? 3 : 2,
                    background: first ?
                    'linear-gradient(140deg, hsl(var(--primary)), hsl(var(--accent)))' :
                    'hsl(var(--card-border))',
                    boxShadow: first ? '0 0 16px hsl(var(--primary) / 0.35)' : undefined
                  }}>

                  <span className="block rounded-full border-2 border-card">
                    <Avatar name={row.name} seed={row.seed} size={first ? 64 : 40} />
                  </span>
                </span>
                <span
                  className="absolute -bottom-[2px] left-1/2 flex h-[22px] min-w-[22px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-card px-[5px] font-sans text-caption font-bold tabular-nums"
                  style={{
                    backgroundColor: first ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                    color: first ? 'hsl(var(--primary-fg))' : 'hsl(var(--muted-fg))'
                  }}>

                  {row.rank}
                </span>
              </div>
              <p className="mt-3 w-full truncate text-center font-sans text-footnote font-semibold text-foreground">
                {row.name.split(' ')[0]}
              </p>
              <p className="w-full truncate text-center font-sans text-caption tabular-nums text-mutedfg">
                {row.score.toFixed(1)}
              </p>
            </div>);

        })}
      </div>
    </section>);

}

/* ── The student's own standing ────────────────────────── */

function MyPosition({ row, improvement }: {row: RankRow;improvement: boolean;}) {
  return (
    <section className="px-4">
      <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
        {t.rankYourPosition}
      </h2>
      <Card>
        <div className="flex items-center gap-3">
          <span className="font-display text-title1 font-bold tabular-nums text-primary">
            #{row.rank}
          </span>
          <Avatar name={row.name} seed={row.seed} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-headline font-semibold text-foreground">
              {row.name}
            </p>
            <p className="font-sans text-footnote text-mutedfg">{t.rankLevel(row.level)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-title3 font-bold tabular-nums text-foreground">
              {improvement && row.delta !== null ? formatDelta(row.delta) : row.score.toFixed(1)}
            </p>
            <p className="font-sans text-caption text-mutedfg">{t.rankScore}</p>
          </div>
        </div>
        <div className="mt-3 border-t border-hairline pt-3">
          <Movement movement={row.movement} />
        </div>
      </Card>
    </section>);

}

function Movement({ movement }: {movement: number | null;}) {
  if (movement === null) {
    return <p className="font-sans text-footnote text-mutedfg">{t.rankNoHistory}</p>;
  }
  if (movement === 0) {
    return (
      <p className="flex items-center gap-[6px] font-sans text-footnote text-mutedfg">
        <MinusIcon size={14} />
        {t.rankMovementNone}
      </p>);

  }
  const up = movement > 0;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <p
      className="flex items-center gap-[6px] font-sans text-footnote font-medium"
      style={{ color: up ? 'hsl(var(--good))' : 'hsl(var(--muted-fg))' }}>

      <Icon size={14} />
      {up ? t.rankMovementUp(movement) : t.rankMovementDown(Math.abs(movement))}
    </p>);

}

/* ── List row ──────────────────────────────────────────── */

function RankRowView({ row, last, improvement }: {row: RankRow;last: boolean;improvement: boolean;}) {
  return (
    <div
      className="flex items-center gap-3 pl-4"
      style={{ backgroundColor: row.you ? 'hsl(var(--primary) / 0.06)' : undefined }}>

      <span className="w-[26px] shrink-0 text-right font-sans text-subhead font-semibold tabular-nums text-mutedfg">
        {row.rank}
      </span>
      <Avatar name={row.name} seed={row.seed} size={32} />
      <div
        className={[
        'flex min-h-[56px] flex-1 items-center gap-3 py-2 pr-4',
        last ? '' : 'border-b border-hairline'].
        join(' ')}>

        <div className="min-w-0 flex-1">
          <p
            className={[
            'truncate font-sans text-subhead text-foreground',
            row.you ? 'font-bold' : 'font-medium'].
            join(' ')}>

            {row.name}
          </p>
          <p className="truncate font-sans text-caption text-mutedfg">{t.rankLevel(row.level)}</p>
        </div>
        <span
          className="shrink-0 font-sans text-subhead font-semibold tabular-nums"
          style={{
            color:
            improvement && row.delta !== null && row.delta > 0 ?
            'hsl(var(--good))' :
            'hsl(var(--foreground))'
          }}>

          {improvement && row.delta !== null ? formatDelta(row.delta) : row.score.toFixed(1)}
        </span>
      </div>
    </div>);

}

/* ── Score component bar ───────────────────────────────── */

function ComponentBar({ label, value, weight }: {label: string;value: number;weight: number;}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-subhead text-foreground">
          {label}
          <span className="ml-[6px] font-sans text-caption tabular-nums text-mutedfg">
            {Math.round(weight * 100)}%
          </span>
        </span>
        <span className="font-sans text-subhead font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-[6px] h-[5px] w-full overflow-hidden rounded-full bg-muted">
        <div
          className="bar-fill h-full rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />

      </div>
    </div>);

}

/* ── How to move up ────────────────────────────────────── */

function HowToImprove({ rows, mine, child }: {rows: RankRow[];mine: RankRow;child: ChildRecord;}) {
  const ahead = rowAhead(rows);
  const weakest = weakestModules(curriculumFor(child.id), 1)[0];

  // Advice comes from the components actually dragging the score down.
  const tips: string[] = [];
  if (weakest) tips.push(t.rankAdviceUnit(weakest.module.title));
  if (child.homeworkRate < 90) tips.push(t.rankAdviceHomework);
  if (mine.components.exams < mine.components.mastery) tips.push(t.rankAdviceExam);

  if (!ahead && tips.length === 0) return null;

  return (
    <section className="px-4">
      <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
        {t.rankHowToMoveUp}
      </h2>
      <Card>
        {ahead &&
        <p className="font-sans text-callout text-foreground">
            {t.rankPointsBehind((ahead.score - mine.score).toFixed(1), ahead.rank)}
          </p>
        }
        {tips.length > 0 &&
        <ul className={['space-y-2', ahead ? 'mt-3 border-t border-hairline pt-3' : ''].join(' ')}>
            {tips.map((tip) =>
          <li key={tip} className="flex items-start gap-2">
                <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
                <span className="font-sans text-subhead text-foreground/90">{tip}</span>
              </li>
          )}
          </ul>
        }
      </Card>
    </section>);

}

function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;
}
