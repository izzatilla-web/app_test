import React from 'react';
import { useCurriculum } from '../useCurriculum';
import { ChevronRightIcon } from 'lucide-react';
import { calculatePassport } from '../passport';
import { calculatePassportFromPortal } from '../portalPassport';
import { student } from '../mockData';
import { curriculumFor } from '../curriculum';
import { currentPosition, levelProgress } from '../access';
import { useUI } from '../ui';
import { haptic } from '../tokens';
import { useLevelIdentity } from '../useLevelIdentity';
import { levelAccent, levelGlow, resolveLevelMeta } from '../types/levelIdentity';

export function GoalProgressDashboardCard() {
  const ui = useUI();
  /* Phoenix-MS owns the figures; the mock record only stands in before the
     portal data arrives. Exams are not needed here — this card shows the goal
     ladder and the topic count, not the average score. */
  const me = ui.activeChild;
  const passport = me ?
  calculatePassportFromPortal({
    levelCode: me.student.levelCode,
    topics: me.topics,
    attendanceRate: me.student.attendanceRate,
    attendanceSessions: me.student.attendanceSessions,
    groupName: me.student.groupName,
    exams: [],
    weakPoints: me.weakPoints
  }) :
  calculatePassport(student);
  const { meta } = useLevelIdentity();
  const accent = levelAccent(meta, ui.dark);

  const levels = useCurriculum();
  const goalMeta = resolveLevelMeta(passport.goal.requiredLevelCode);

  /* The level a student is on is Phoenix-MS's answer, never the app's own
     curriculum guess — otherwise this card says A2 while the passport above it
     says A3.2. `meta` already follows the CRM rung (see useLevelIdentity), and
     `rungCode` is that rung in full for the label. */
  const activeLevelCode = meta.code;
  const rungCode = ui.activeChild?.student.levelCode || meta.code;
  /* Read off the aligned curriculum, so the topic named here sits inside the
     rung Phoenix-MS placed the student on. */
  const position = currentPosition(levels);

  // Every level on the path from A1 up to the goal level
  const goalPathLevels = levels
    .filter((level) => resolveLevelMeta(level.code).sequence <= goalMeta.sequence)
    .map((level) => {
      const prog = levelProgress(level);
      const isCurrent = level.code === activeLevelCode;
      const isCompleted = prog.percent === 100;
      return {
        code: level.code,
        title: level.title,
        done: prog.done,
        total: prog.total,
        percent: prog.percent,
        isCurrent,
        isCompleted
      };
    });

  // Every topic from A1 up to the goal level (CRM ladder scope).
  const scopedTopics = levels
    .filter((level) => resolveLevelMeta(level.code).sequence <= goalMeta.sequence)
    .flatMap((level) => level.modules.flatMap((module) => module.topics));

  const topicsTotal = scopedTopics.length; // e.g. 51
  const topicsDone = scopedTopics.filter((topic) => topic.studied).length; // e.g. 16
  const topicsLeft = topicsTotal - topicsDone; // e.g. 35
  const percent = topicsTotal > 0 ? Math.round((topicsDone / topicsTotal) * 100) : 0;

  // Current level progress stats
  const currentLevelData = goalPathLevels.find((l) => l.isCurrent) || goalPathLevels[0];

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  function handleClick() {
    haptic('light');
    // Switch to Progress tab (index 5)
    ui.goToTab(5);
  }

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 text-left shadow-2xs transition-all duration-200 ease-out hover:border-slate-300 active:scale-[0.99] dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      {/* ── 1. Header: Goal Title ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-base sm:text-lg font-bold text-foreground">
            {passport.goal.title}
          </h3>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200 group-hover:text-foreground dark:bg-slate-800 dark:text-slate-400">
          <ChevronRightIcon size={16} strokeWidth={2.4} />
        </div>
      </div>

      {/* ── 2. Clean Level Steps Row ── */}
      <div className="mt-3 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
        {goalPathLevels.map((lvl, idx) => {
          const isLast = idx === goalPathLevels.length - 1;
          return (
            <React.Fragment key={lvl.code}>
              <div
                className={[
                  'flex h-7 min-w-[34px] items-center justify-center rounded-lg px-2 text-center transition-all shrink-0 font-sans text-xs font-bold',
                  lvl.isCurrent
                    ? 'bg-primary text-white shadow-2xs'
                    : lvl.isCompleted
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                ].join(' ')}
              >
                {lvl.code}
              </div>

              {!isLast && (
                <div className="h-[2px] w-2 sm:w-2.5 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── 3. Ring + Clear Stats ── */}
      <div className="mt-3.5 flex items-center gap-4 sm:gap-6">
        {/* Ring */}
        <div className="relative flex h-20 w-20 sm:h-22 sm:w-22 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#goalCardGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="goalCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={levelAccent(meta, false)} />
                <stop offset="100%" stopColor={levelAccent(meta, true)} />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-center">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-none">
              {percent}%
            </span>
          </div>
        </div>

        {/* Clear Stats */}
        <div className="flex flex-1 flex-col justify-center space-y-2">
          {/* Current Level Stat */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans text-xs font-medium text-mutedfg">
              Joriy daraja ({rungCode}):
            </span>
            <span className="font-display text-sm sm:text-base font-bold text-foreground tabular-nums">
              {currentLevelData?.done || 0} / {currentLevelData?.total || 0} mavzu
            </span>
          </div>

          <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

          {/* Goal Level Stat */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans text-xs font-medium text-mutedfg">
              Maqsadgacha ({goalMeta.code}):
            </span>
            <span className="font-display text-sm sm:text-base font-bold text-primary tabular-nums">
              {topicsLeft} ta mavzu qoldi
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Unified Clean Progress Bar ── */}
      <div className="mt-3.5 w-full space-y-1">
        <div className="flex items-center justify-between font-sans text-[11px] font-medium text-mutedfg">
          <span>O‘tildi: {topicsDone} mavzu</span>
          <span>Jami: {topicsTotal} mavzu ({goalMeta.code} gacha)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${levelGlow(meta, 0.65)}, ${accent})`,
              boxShadow: `0 0 8px ${levelGlow(meta, 0.4)}`
            }}
          />
        </div>
      </div>

      {/* ── 5. Current Topic ── */}
      {position && (
        <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <span className="font-sans text-xs text-mutedfg">
            Hozirgi mavzu: <span className="font-semibold text-foreground">{position.topic.title}</span>
          </span>
        </div>
      )}
    </div>
  );
}
