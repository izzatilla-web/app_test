import React from 'react';
import { CheckIcon, ChevronRightIcon, LockIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { t } from '../strings';
import { haptic, ASSETS_3D } from '../tokens';
import {
  levelAccess,
  levelProgress,
  moduleAccess,
  moduleProgress
} from '../access';
import type { ItemState } from '../access';
import { curriculumFor } from '../curriculum';
import type { CurriculumLevel, CurriculumModule } from '../curriculum';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { LevelDetail } from '../screens/LevelDetail';
import { ModuleDetail } from '../screens/ModuleDetail';

/**
 * The learning curriculum browser:
 * Clean cards with 3D illustrations and corner-draped flags emerging from the top-right corner.
 */
export function CurriculumBrowser({ child }: { child: ChildRecord }) {
  const ui = useUI();
  const levels = curriculumFor(child.id);

  if (levels.length === 0) {
    return <EmptyState icon={LockIcon} title={t.lsEmptyTitle} body={t.lsEmptyBody} />;
  }

  function openLevel(level: CurriculumLevel) {
    haptic('light');
    ui.push({
      key: `level-${level.id}`,
      backTitle: t.tabLessons,
      node: <LevelDetail child={child} levelId={level.id} />
    });
  }

  function openModule(level: CurriculumLevel, module: CurriculumModule) {
    haptic('light');
    ui.push({
      key: `module-${module.id}`,
      backTitle: t.tabLessons,
      node: <ModuleDetail child={child} levels={levels} level={level} module={module} />
    });
  }

  return (
    <div className="space-y-6 px-4 pb-10 pt-4">
      {levels.map((level) => {
        const state = levelAccess(levels, level);
        if (state === 'locked') return <LockedLevelCard key={level.id} level={level} />;
        if (state === 'completed') {
          return (
            <LevelHeroCard
              key={level.id}
              level={level}
              state={state}
              asset3D={ASSETS_3D.mathBookCap}
              onOpen={() => openLevel(level)}
            />
          );
        }

        // Current active level: Hero Card + Clean 1x1 Module Cards
        return (
          <div key={level.id} className="space-y-3.5">
            <LevelHeroCard
              level={level}
              state={state}
              asset3D={ASSETS_3D.numbers248}
              onOpen={() => openLevel(level)}
            />

            <div className="space-y-2.5 pt-2">
              <h3 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {level.code} Modullari
              </h3>

              {level.modules.map((module) => (
                <ModuleSummaryCard
                  key={module.id}
                  levels={levels}
                  module={module}
                  onOpen={() => openModule(level, module)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Level Hero Card with Top-Right Corner Draped Flag ──────────────── */

function LevelHeroCard({
  level,
  state,
  asset3D,
  onOpen
}: {
  level: CurriculumLevel;
  state: ItemState;
  asset3D?: string;
  onOpen?: () => void;
}) {
  const progress = levelProgress(level);
  const completed = state === 'completed';

  // Lighter, fresher, luminous multi-tonal gradients with brighter right side for 3D art
  const gradientBg = completed
    ? 'linear-gradient(115deg, #1D4ED8 0%, #2563EB 35%, #3B82F6 65%, #93C5FD 100%)'
    : 'linear-gradient(115deg, #3730A3 0%, #4F46E5 35%, #6366F1 65%, #A5B4FC 100%)';

  const inner = (
    <div
      className="relative flex min-h-[148px] items-center justify-between rounded-2xl p-5 text-white shadow-sm overflow-hidden"
      style={{ background: gradientBg }}
    >
      {/* Soft ambient inner glow on left */}
      <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />

      {/* Luminous soft highlight on right behind 3D asset */}
      <div className="pointer-events-none absolute -right-2 -bottom-2 h-40 w-40 rounded-full bg-white/25 blur-2xl" />

      {/* Draped Flag Ribbon flush with the top edge of the card with elastic wind sway */}
      <div
        className="pointer-events-none absolute top-0 right-4 sm:right-6 z-20"
      >
        <div
          className={[
            'animate-flag-wind-x flex items-center justify-center px-3 py-1.5 shadow-md border-b border-x',
            completed
              ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-400/40 shadow-emerald-950/25'
              : 'bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-700 text-white border-blue-400/40 shadow-blue-950/25'
          ].join(' ')}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)',
            minWidth: '86px'
          }}
        >
          <div className="flex items-center gap-1 font-sans text-[10px] font-bold tracking-tight pb-1 pt-0.5">
            {completed ? (
              <>
                <CheckIcon size={11} strokeWidth={3.5} className="text-white shrink-0" />
                <span>Yakunlangan</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse shrink-0" />
                <span>Joriy</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Left content with room for 3D illustration on the right */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col pr-28">
        <span className="font-display text-2xl font-bold tracking-tight text-white">
          {level.code}
        </span>

        <span className="mt-1 block truncate font-sans text-base font-semibold text-white">
          {level.title}
        </span>

        {/* Progress bar with space-between numbers */}
        <div className="mt-4 w-full">
          <div className="mb-1.5 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-white/90">
            <span>{progress.done} / {progress.total} mavzu</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="bar-fill h-full rounded-full bg-white shadow-sm"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right 3D Visual Asset — Anchored at bottom-right */}
      {asset3D && (
        <div
          className="pointer-events-none absolute -bottom-3 -right-2 z-10 flex h-32 w-32 shrink-0 items-center justify-center"
        >
          <img
            src={asset3D}
            alt={level.title}
            className="h-full w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)]"
          />
        </div>
      )}
    </div>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="group relative block w-full text-left transition-all duration-150 ease-out active:scale-[0.99] active:opacity-95"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="relative block w-full">
      {inner}
    </div>
  );
}

function LockedLevelCard({ level }: { level: CurriculumLevel }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 opacity-60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-display text-base font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {level.code}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate font-sans text-sm font-semibold text-foreground">
          {level.title}
        </span>
        <span className="mt-0.5 block font-sans text-xs text-mutedfg">{t.lsLevelLockedHint}</span>
      </div>
      <LockIcon size={16} aria-label={t.lsStateLocked} className="shrink-0 text-mutedfg" />
    </div>
  );
}

/* ── 1x1 Direct Module Card ──────────────────────────────── */

function ModuleSummaryCard({
  levels,
  module,
  onOpen
}: {
  levels: CurriculumLevel[];
  module: CurriculumModule;
  onOpen: () => void;
}) {
  const state = moduleAccess(levels, module);
  const progress = moduleProgress(module);
  const locked = state === 'locked';
  const current = state === 'current';
  const completed = state === 'completed';

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onOpen}
      className={[
        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99] shadow-sm',
        current
          ? 'border-blue-500/40 bg-white dark:bg-slate-900 ring-1 ring-blue-500/20'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        locked ? 'opacity-55 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-700'
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-blue-600 dark:text-blue-400">
            {module.code}
          </span>
          {completed ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckIcon size={10} strokeWidth={3.5} />
              Yakunlandi
            </span>
          ) : current ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-sans text-[10px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              JORIY
            </span>
          ) : null}
        </div>

        <h4 className="mt-1 font-sans text-base font-bold text-foreground truncate">
          {module.title}
        </h4>

        {/* Progress bar */}
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="bar-fill h-full rounded-full bg-blue-600"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="font-sans text-xs font-semibold tabular-nums text-mutedfg">
            {progress.done}/{progress.total} mavzu
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400">
        {locked ? (
          <LockIcon size={14} className="text-mutedfg" />
        ) : (
          <ChevronRightIcon size={18} className="text-slate-500 dark:text-slate-400" />
        )}
      </div>
    </button>
  );
}
