import { useMemo } from 'react';
import {
  AwardIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  PlayCircleIcon,
  ChevronRightIcon,
  CheckIcon
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
        className="relative min-h-[142px] overflow-hidden rounded-2xl p-5 text-white backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.4)] dark:border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.76) 0%, rgba(59, 130, 246, 0.70) 35%, rgba(96, 165, 250, 0.64) 70%, rgba(147, 197, 253, 0.58) 100%)'
        }}
      >
        {/* Top-down subtle specular glass sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent" />

        {/* Soft ambient inner glow on left */}
        <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/20 blur-xl" />

        {/* Luminous soft highlight on right behind 3D asset */}
        <div className="pointer-events-none absolute -right-2 -bottom-2 h-40 w-40 rounded-full bg-white/25 blur-2xl" />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col pr-28">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 font-sans text-xs font-bold text-white backdrop-blur-sm shadow-sm">
              Joriy daraja: {child.level}
            </span>
          </div>

          <p className="mt-2.5 font-display text-3xl font-bold tabular-nums leading-none text-white">
            {overall.percent}%
          </p>
          <p className="mt-1 font-sans text-xs font-medium text-white/85">
            Umumiy o‘zlashtirish
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

        <div className="space-y-3">
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
                className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-4 pt-3.5 pb-4 text-left shadow-sm transition-all duration-200 ease-out hover:border-slate-300 active:scale-[0.985] dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                {/* Level Code */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={[
                      'font-display text-sm font-bold',
                      isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    ].join(' ')}
                  >
                    {lvl.code}
                  </span>
                </div>

                {/* Level Title & Chevron */}
                <div className="mt-0.5 flex items-center justify-between w-full">
                  <h4 className="truncate pr-2 font-sans text-sm sm:text-[15px] font-semibold text-foreground">
                    {lvl.title}
                  </h4>
                  <div className="shrink-0 flex h-6 w-6 items-center justify-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    <ChevronRightIcon size={18} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Clean Full-Width Progress Section */}
                <div className="mt-3.5 w-full">
                  <div className="mb-1.5 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-mutedfg">
                    <span>{doneCount} / {totalCount} mavzu</span>
                    <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={[
                        'bar-fill h-full rounded-full transition-all duration-500 ease-out',
                        isCompleted
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      ].join(' ')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
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
