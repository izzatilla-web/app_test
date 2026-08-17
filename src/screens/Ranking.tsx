import React, { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  MinusIcon,
  TrophyIcon,
  SparklesIcon,
  CrownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { SegmentedControl } from '../components/SegmentedControl';
import { EmptyState } from '../components/EmptyState';
import { t } from '../strings';
import { haptic } from '../tokens';
import { SCORE_WEIGHTS } from '../academics';
import { buildRanking, myRow, RANKING_MIN_EXAMS } from '../ranking';
import type { RankingScope, RankRow } from '../ranking';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';

/**
 * Academic Level Leaderboard — Pixel-perfect 1:1 3D Podium inspired by reference,
 * customized specifically for academic performance and level hierarchies.
 */
export function Ranking({ child, backTitle }: { child: ChildRecord; backTitle: string }) {
  const ui = useUI();
  // 0 = "Mening levelim", 1 = "Barcha levellar"
  const [scopeIndex, setScopeIndex] = useState<number>(0);
  const [formulaOpen, setFormulaOpen] = useState<boolean>(false);

  const scope: RankingScope = scopeIndex === 0 ? 'level' : 'all';
  const performance = useMemo(() => buildRanking(child, scope), [child, scope]);
  const mine = useMemo(() => myRow(performance), [performance]);

  if (child.exams.length < RANKING_MIN_EXAMS) {
    return (
      <PushScreen title={t.rankingTitle} backTitle={backTitle} onBack={ui.pop}>
        <EmptyState icon={TrophyIcon} title={t.rankEmptyTitle} body={t.rankEmptyBody} />
      </PushScreen>
    );
  }

  const top3 = performance.slice(0, 3);
  const remainingRows = performance.slice(3);

  // Student directly ahead of current user for motivation
  const myIndex = performance.findIndex((r) => r.you);
  const aheadStudent = myIndex > 0 ? performance[myIndex - 1] : undefined;
  const pointsBehind = aheadStudent && mine ? (aheadStudent.score - mine.score).toFixed(1) : null;

  return (
    <PushScreen title={t.rankingTitle} backTitle={backTitle} onBack={ui.pop}>
      <div className="space-y-6 px-4 pb-24 pt-1">
        {/* ── 1. Segmented Control Tabs ── */}
        <div className="space-y-3">
          <SegmentedControl
            options={[t.rankTabMyLevel, t.rankTabAllLevels]}
            value={scopeIndex}
            onChange={(idx) => {
              haptic('light');
              setScopeIndex(idx);
            }}
          />

          {/* Contextual Academic Level Banner */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-xs font-bold text-foreground">
                {scopeIndex === 0 ? t.rankContextMyLevel(child.level) : t.rankContextAllLevels}
              </span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-sans text-[11px] font-semibold text-mutedfg dark:bg-slate-800">
              {performance.length} ta o'quvchi
            </span>
          </div>
        </div>

        {/* ── 2. Pixel-Perfect 3D Connected Podium (#2, #1, #3) ── */}
        {top3.length === 3 && (
          <Connected3DPodium rows={top3} />
        )}

        {/* ── 3. Highlighted Current User Card ("Sizning o‘rningiz") ── */}
        {mine && (
          <section className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
                {t.rankYourPosition}
              </h3>
            </div>
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-4 sm:p-5 shadow-sm dark:border-blue-500/30 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900">
              {/* Main Student Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-2xl font-black tabular-nums text-blue-600 dark:text-blue-400 shrink-0">
                    #{mine.rank}
                  </span>
                  <div className="rounded-full ring-2 ring-blue-500/30 p-0.5 bg-white dark:bg-slate-900 shrink-0">
                    <Avatar name={mine.name} seed={mine.seed} size={40} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-bold text-foreground">
                      {mine.name}
                    </p>
                    <p className="font-sans text-xs text-mutedfg">
                      {mine.level} daraja
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                    {mine.score.toFixed(1)}
                  </p>
                  <p className="font-sans text-[10px] font-medium text-mutedfg">
                    {t.rankScore}
                  </p>
                </div>
              </div>

              {/* Bottom Rank Movement & Points Gap — Seamless Apple layout */}
              <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-blue-100/70 pt-3 dark:border-blue-900/40">
                <MovementPill movement={mine.movement} />

                {aheadStudent && pointsBehind && (
                  <span className="font-sans text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    #{aheadStudent.rank} {aheadStudent.name.split(' ')[0]}dan <strong className="text-primary font-semibold">{pointsBehind} ball</strong> orqadasiz
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 4. Ranking List Below Podium (#4 and onward) ── */}
        {remainingRows.length > 0 && (
          <section className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
                {t.rankTopStudents}
              </h3>
              <span className="font-sans text-xs text-mutedfg">
                {t.rankScore}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-900">
              {remainingRows.map((row, i) => (
                <RankRowItem
                  key={row.id}
                  row={row}
                  last={i === remainingRows.length - 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Academic Score Formula Accordion ── */}
        {mine && (
          <section className="pt-1">
            <Card padded={false}>
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setFormulaOpen((open) => !open);
                }}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-opacity duration-100 ease-out active:opacity-70"
              >
                <span className="font-sans text-sm font-semibold text-foreground">
                  {t.rankHowCalculated}
                </span>
                <ChevronDownIcon
                  size={18}
                  className="shrink-0 text-mutedfg transition-transform duration-200 ease-out"
                  style={{ transform: formulaOpen ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {formulaOpen && (
                <div className="border-t border-hairline p-4 slide-up-fade">
                  <p className="font-sans text-xs text-mutedfg">{t.rankFormulaIntro}</p>
                  <div className="mt-3.5 space-y-3">
                    <ScoreComponentBar
                      label={t.rankComponentMastery}
                      value={mine.components.mastery}
                      weight={SCORE_WEIGHTS.mastery}
                    />
                    <ScoreComponentBar
                      label={t.rankComponentExams}
                      value={mine.components.exams}
                      weight={SCORE_WEIGHTS.exams}
                    />
                    <ScoreComponentBar
                      label={t.rankComponentHomework}
                      value={mine.components.homework}
                      weight={SCORE_WEIGHTS.homework}
                    />
                    <ScoreComponentBar
                      label={t.rankComponentCurriculum}
                      value={mine.components.curriculum}
                      weight={SCORE_WEIGHTS.curriculum}
                    />
                    <ScoreComponentBar
                      label={t.rankComponentConsistency}
                      value={mine.components.consistency}
                      weight={SCORE_WEIGHTS.consistency}
                    />
                  </div>

                  <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
                    <span className="font-sans text-xs font-medium text-mutedfg">{t.rankScore}</span>
                    <span className="font-display text-xl font-bold tabular-nums text-primary">
                      {mine.score.toFixed(1)} {t.rankPointsUnit}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </section>
        )}
      </div>
    </PushScreen>
  );
}

/* ── 1:1 Monolithic 3D Podium Geometry with Isometric Depth ──── */

function Connected3DPodium({ rows }: { rows: RankRow[] }) {
  // Ordered: [ #2 Silver (Left), #1 Gold (Center), #3 Bronze (Right) ]
  const silver = rows[1];
  const gold = rows[0];
  const bronze = rows[2];

  return (
    <div className="relative pt-1 pb-1">
      {/* ── Top Floating Student Profiles ── */}
      <div className="grid grid-cols-3 gap-2 px-1 z-10 relative">
        {/* #2 Silver (Left) */}
        <div className="flex flex-col items-center justify-end pb-3">
          <div className="relative mb-1.5">
            <div className="rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 p-0.5 shadow-sm">
              <div className="rounded-full bg-white p-0.5 dark:bg-slate-900">
                <Avatar name={silver.name} seed={silver.seed} size={40} />
              </div>
            </div>
            {/* Medal Badge */}
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-800 text-[11px] font-display font-bold shadow-xs ring-2 ring-white dark:ring-slate-900">
              2
            </span>
          </div>

          <p className="max-w-[84px] truncate text-center font-sans text-xs font-bold text-foreground">
            {silver.name.split(' ')[0]}
          </p>
          <span className="font-sans text-[10px] text-mutedfg leading-tight">
            {silver.level} daraja
          </span>
          <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 font-sans text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 tabular-nums shadow-xs">
            <span>{silver.score.toFixed(1)}</span>
          </div>
          <div className="mt-1">
            <MovementPill movement={silver.movement} mini />
          </div>
        </div>

        {/* #1 Gold Leader (Center) */}
        <div className="flex flex-col items-center justify-end pb-3">
          {/* Crown */}
          <div className="mb-0.5 text-amber-500 animate-bounce">
            <CrownIcon size={18} className="fill-current" />
          </div>

          <div className="relative mb-1.5">
            <div className="rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-0.5 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50">
              <div className="rounded-full bg-white p-0.5 dark:bg-slate-900">
                <Avatar name={gold.name} seed={gold.seed} size={64} />
              </div>
            </div>
            {/* Gold Badge */}
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 text-xs font-display font-black shadow-sm ring-2 ring-white dark:ring-slate-900">
              1
            </span>
          </div>

          <p className="max-w-[96px] truncate text-center font-sans text-xs font-bold text-foreground">
            {gold.name.split(' ')[0]}
          </p>
          <span className="font-sans text-[10px] text-mutedfg leading-tight">
            {gold.level} daraja
          </span>
          <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 font-sans text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400/30 tabular-nums shadow-xs">
            <span>{gold.score.toFixed(1)}</span>
          </div>
          <div className="mt-1">
            <MovementPill movement={gold.movement} mini />
          </div>
        </div>

        {/* #3 Bronze (Right) */}
        <div className="flex flex-col items-center justify-end pb-3">
          <div className="relative mb-1.5">
            <div className="rounded-full bg-gradient-to-tr from-orange-300 to-amber-600 p-0.5 shadow-sm">
              <div className="rounded-full bg-white p-0.5 dark:bg-slate-900">
                <Avatar name={bronze.name} seed={bronze.seed} size={40} />
              </div>
            </div>
            {/* Bronze Badge */}
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 text-white text-[11px] font-display font-bold shadow-xs ring-2 ring-white dark:ring-slate-900">
              3
            </span>
          </div>

          <p className="max-w-[84px] truncate text-center font-sans text-xs font-bold text-foreground">
            {bronze.name.split(' ')[0]}
          </p>
          <span className="font-sans text-[10px] text-mutedfg leading-tight">
            {bronze.level} daraja
          </span>
          <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-2 py-0.5 font-sans text-[11px] font-bold text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 tabular-nums shadow-xs">
            <span>{bronze.score.toFixed(1)}</span>
          </div>
          <div className="mt-1">
            <MovementPill movement={bronze.movement} mini />
          </div>
        </div>
      </div>

      {/* ── Continuous Monolithic 3D Podium Geometry (1:1 with Reference) ── */}
      <div className="relative w-full h-[126px] mt-1">
        {/* Soft floor shadow */}
        <div className="absolute bottom-0 inset-x-2 h-4 bg-black/15 dark:bg-black/40 blur-lg rounded-full pointer-events-none" />

        <svg
          viewBox="0 0 340 120"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible drop-shadow-md"
        >
          <defs>
            {/* Linear Gradients for 3D Faces */}
            {/* Step 2 (Left Silver) */}
            <linearGradient id="podium-top-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="podium-front-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Step 1 (Center Gold / Primary Leader) */}
            <linearGradient id="podium-top-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>
            <linearGradient id="podium-front-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
            <linearGradient id="podium-side-1-left" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="podium-side-1-right" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#172554" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Step 3 (Right Bronze) */}
            <linearGradient id="podium-top-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="podium-front-3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          {/* ── #2 Left Pillar ── */}
          {/* Top 3D Face */}
          <polygon points="10,48 114,48 120,38 18,38" fill="url(#podium-top-2)" />
          {/* Front Face */}
          <rect x="10" y="48" width="104" height="72" rx="1" fill="url(#podium-front-2)" />
          {/* Numeral 2 */}
          <text
            x="62"
            y="94"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="46"
            fill="white"
            fillOpacity="0.18"
          >
            2
          </text>

          {/* ── #3 Right Pillar ── */}
          {/* Top 3D Face */}
          <polygon points="226,62 330,62 322,52 220,52" fill="url(#podium-top-3)" />
          {/* Front Face */}
          <rect x="226" y="62" width="104" height="58" rx="1" fill="url(#podium-front-3)" />
          {/* Numeral 3 */}
          <text
            x="278"
            y="104"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="44"
            fill="white"
            fillOpacity="0.18"
          >
            3
          </text>

          {/* ── #1 Center Pillar (Taller & In Front) ── */}
          {/* Left Exposed 3D Depth Facet */}
          <polygon points="114,14 120,6 120,38 114,48" fill="url(#podium-side-1-left)" />
          {/* Right Exposed 3D Depth Facet */}
          <polygon points="226,14 232,6 232,52 226,62" fill="url(#podium-side-1-right)" />
          {/* Top 3D Face */}
          <polygon points="114,14 226,14 232,6 120,6" fill="url(#podium-top-1)" />
          {/* Front Face */}
          <rect x="114" y="14" width="112" height="106" rx="2" fill="url(#podium-front-1)" />
          {/* Light Sheen Reflection */}
          <path d="M114,14 L226,14 L226,26 L114,32 Z" fill="white" fillOpacity="0.14" />
          {/* Numeral 1 */}
          <text
            x="170"
            y="78"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="54"
            fill="white"
            fillOpacity="0.26"
          >
            1
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── Remaining List Row Item (#4 and onward) ──────────────────── */

function RankRowItem({ row, last }: { row: RankRow; last: boolean }) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-3 px-4 py-3 transition-colors',
        row.you
          ? 'bg-blue-50/70 dark:bg-blue-950/30'
          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
        last ? '' : 'border-b border-slate-100 dark:border-slate-800/70'
      ].join(' ')}
    >
      {/* Rank, Avatar & Name */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-6 shrink-0 font-sans text-xs font-bold tabular-nums text-mutedfg text-center">
          #{row.rank}
        </span>
        <Avatar name={row.name} seed={row.seed} size={32} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`truncate font-sans text-xs sm:text-sm ${row.you ? 'font-bold text-primary' : 'font-semibold text-foreground'}`}>
              {row.name}
            </p>
            {row.you && (
              <span className="rounded-sm bg-blue-100 px-1 py-0.2 font-sans text-[9px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {t.rankBadgeYou}
              </span>
            )}
          </div>
          <span className="font-sans text-[11px] text-mutedfg">
            {row.level} daraja
          </span>
        </div>
      </div>

      {/* Movement & Score */}
      <div className="flex items-center gap-3 shrink-0">
        <MovementPill movement={row.movement} mini />

        <div className="w-14 text-right">
          <span className="font-display text-sm font-bold tabular-nums text-foreground">
            {row.score.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Movement Badge (↑ 3, ↓ 1, —) ─────────────────────────────── */

function MovementPill({
  movement,
  mini = false
}: {
  movement: number | null;
  mini?: boolean;
}) {
  if (movement === null || movement === 0) {
    return (
      <span className="inline-flex items-center gap-1 font-sans text-[11px] font-medium text-mutedfg">
        <MinusIcon size={12} />
        {!mini && <span>{t.rankMovementNone}</span>}
      </span>
    );
  }

  const isUp = movement > 0;
  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 rounded-full font-sans font-bold tabular-nums',
        mini ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-xs',
        isUp
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
      ].join(' ')}
    >
      {isUp ? <ArrowUpIcon size={11} strokeWidth={2.5} /> : <ArrowDownIcon size={11} strokeWidth={2.5} />}
      <span>{Math.abs(movement)}</span>
      {!mini && <span className="ml-0.5 font-normal">o'rin</span>}
    </span>
  );
}

/* ── Score Component Breakdown Bar ────────────────────────────── */

function ScoreComponentBar({
  label,
  value,
  weight
}: {
  label: string;
  value: number;
  weight: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-xs font-medium text-foreground">
          {label}
          <span className="ml-1.5 font-sans text-[11px] tabular-nums text-mutedfg">
            ({Math.round(weight * 100)}%)
          </span>
        </span>
        <span className="font-sans text-xs font-bold tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="bar-fill h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
