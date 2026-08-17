import { useMemo } from 'react';
import {
  AwardIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  PlayCircleIcon,
  ChevronRightIcon
} from 'lucide-react';
import { t } from '../strings';
import { ASSETS_3D, haptic } from '../tokens';
import {
  curriculumProgress,
  currentPosition
} from '../access';
import { curriculumFor } from '../curriculum';
import type { CurriculumLevel } from '../curriculum';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { LevelDetail } from '../screens/LevelDetail';

/**
 * Clean Academic Progress Overview Screen:
 * 1. Progress Hero Card with 3D Diploma / Passport
 * 2. Key Academic Stats (Average Exam Score & Watched Videos)
 * 3. Level Progression Cards
 * 4. Strengths & Development Areas
 */
export function ProgressOverview({ child }: { child: ChildRecord }) {
  const ui = useUI();
  const levels = useMemo(() => curriculumFor(child.id), [child.id]);
  const overall = useMemo(() => curriculumProgress(levels), [levels]);
  const position = useMemo(() => currentPosition(levels), [levels]);

  // Exam stats calculations
  const exams = child.exams || [];
  const avgScore = useMemo(() => {
    if (exams.length === 0) return 0;
    const sum = exams.reduce((acc, ex) => acc + (ex.score || 0), 0);
    return Math.round(sum / exams.length);
  }, [exams]);

  // Watched videos count
  const watchedCount = useMemo(() => {
    return levels.reduce((acc, lvl) => {
      return (
        acc +
        lvl.modules.reduce((mAcc, mod) => {
          return (
            mAcc +
            mod.topics.reduce((tAcc, top) => {
              return (
                tAcc +
                top.content.videos.filter((v) => v.watched).length
              );
            }, 0)
          );
        }, 0)
      );
    }, 0);
  }, [levels]);

  function openLevel(level: CurriculumLevel) {
    haptic('light');
    ui.push({
      key: `level-${level.id}`,
      backTitle: t.tabProgress,
      node: <LevelDetail child={child} levelId={level.id} />
    });
  }

  return (
    <div className="space-y-5 px-4 pb-20 pt-2">
      {/* 1. Progress Hero Card */}
      <div
        className="relative min-h-[142px] overflow-hidden rounded-2xl p-5 text-white shadow-sm"
        style={{
          background: 'linear-gradient(115deg, #1D4ED8 0%, #2563EB 35%, #3B82F6 65%, #93C5FD 100%)'
        }}
      >
        {/* Soft ambient inner glow on left */}
        <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />

        {/* Luminous soft highlight on right behind 3D asset */}
        <div className="pointer-events-none absolute -right-2 -bottom-2 h-40 w-40 rounded-full bg-white/25 blur-2xl" />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col pr-28">
          <span className="font-sans text-xs font-semibold text-white/90">
            {child.firstName} · {child.level}
          </span>

          <p className="mt-1.5 font-display text-3xl font-bold tabular-nums leading-none text-white">
            {overall.percent}%
          </p>
          <p className="mt-0.5 font-sans text-xs font-medium text-white/80">
            Umumiy o'zlashtirish
          </p>

          <div className="mt-3.5 w-full">
            <div className="mb-1 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-white/90">
              <span>{overall.done} / {overall.total} mavzu</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="bar-fill h-full rounded-full bg-white shadow-sm"
                style={{ width: `${overall.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3D Learning Diploma / Passport — Static and clean */}
        <div
          className="pointer-events-none absolute -bottom-3 -right-2 z-10 flex h-32 w-32 shrink-0 items-center justify-center"
          style={{ transform: 'rotate(-5deg)' }}
        >
          <img
            src={ASSETS_3D.passport3d}
            alt="Progress"
            className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          />
        </div>
      </div>

      {/* 2. Key Academic Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <AwardIcon size={16} className="text-amber-500" />
            <span className="font-sans text-xs font-semibold text-mutedfg">
              O'rtacha ball
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            {avgScore}%
          </p>
          <p className="mt-0.5 font-sans text-xs text-mutedfg">
            {exams.length} ta imtihon natijasi
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <PlayCircleIcon size={16} className="text-blue-500" />
            <span className="font-sans text-xs font-semibold text-mutedfg">
              Video darslar
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            {watchedCount} ta
          </p>
          <p className="mt-0.5 font-sans text-xs text-mutedfg">
            Ko'rilgan mavzular
          </p>
        </div>
      </div>

      {/* 3. Level Breakdown */}
      <div className="space-y-3">
        <h3 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Darajalar bo'yicha natija
        </h3>

        <div className="space-y-2.5">
          {levels.map((lvl) => {
            const isCurrent = position?.level.id === lvl.id;
            const isCompleted = lvl.modules.every((m) =>
              m.topics.every((t) => t.studied)
            );
            const doneCount = lvl.modules.reduce(
              (acc, m) => acc + m.topics.filter((t) => t.studied).length,
              0
            );
            const totalCount = lvl.modules.reduce((acc, m) => acc + m.topics.length, 0);
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => openLevel(lvl)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-150 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-blue-600 dark:text-blue-400">
                      {lvl.code}
                    </span>
                    {isCompleted && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        Yakunlangan
                      </span>
                    )}
                    {isCurrent && !isCompleted && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 font-sans text-[10px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                        Joriy
                      </span>
                    )}
                  </div>

                  <p className="mt-1 font-sans text-sm font-bold text-foreground truncate">
                    {lvl.title}
                  </p>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="bar-fill h-full rounded-full bg-blue-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-sans text-xs font-semibold tabular-nums text-mutedfg">
                      {doneCount}/{totalCount} mavzu · {pct}%
                    </span>
                  </div>
                </div>

                <ChevronRightIcon size={18} className="shrink-0 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Strong & Weak Areas */}
      <div className="grid grid-cols-1 gap-3">
        {exams.some((e) => e.score >= 85) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon size={16} />
              <h4 className="font-sans text-xs font-bold uppercase tracking-wider">
                Kuchli mavzular
              </h4>
            </div>
            <div className="mt-2.5 space-y-2">
              {exams
                .filter((e) => e.score >= 85)
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">{e.topic}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {e.score}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {exams.some((e) => e.score < 80) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircleIcon size={16} />
              <h4 className="font-sans text-xs font-bold uppercase tracking-wider">
                Qo'shimcha mashq kerak
              </h4>
            </div>
            <div className="mt-2.5 space-y-2">
              {exams
                .filter((e) => e.score < 80)
                .slice(0, 2)
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">{e.topic}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {e.score}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
