import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { haptic, ASSETS_3D } from '../tokens';
import { t } from '../strings';
import { calculatePassport } from '../passport';
import type { AcademicPassport } from '../passport';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { curriculumFor } from '../curriculum';
import type { CurriculumModule } from '../curriculum';
import { moduleExam } from '../access';
import { resolveLevelMeta } from '../types/levelIdentity';
import { CollapsibleLevelBands } from './CollapsibleLevelBands';

interface AcademicPassportViewProps {
  child: ChildRecord;
  isParent?: boolean;
}

export function AcademicPassportView({ child, isParent = false }: AcademicPassportViewProps) {
  const ui = useUI();
  const passport: AcademicPassport = calculatePassport(child);
  const levels = curriculumFor(child.id);

  /* One card owns the goal: tapping it opens the detailed ladder (the old
     standalone "O‘quv narvoni" card duplicated this job and was removed). */
  const [goalExpanded, setGoalExpanded] = useState<boolean>(false);

  /* Equal-interval ruler — 5 milestones (A1 · A2 · B1 · B2 · goal) at equal
     spacing, 4 equal segments between them. The cursor travels inside its
     segment proportionally to real topic progress, so its movement is always
     orderly and the tick geometry never drifts. */
  const goalSequence = resolveLevelMeta(passport.goal.requiredLevelCode).sequence;
  const scopedLevels = levels.filter(
    (lvl) => resolveLevelMeta(lvl.code).sequence <= goalSequence
  );

  const milestoneCodes = ['A1', 'A2', 'B1', 'B2', passport.goal.requiredLevelCode];
  const milestoneSeqs = milestoneCodes.map((code) => resolveLevelMeta(code).sequence);
  const segmentCount = milestoneSeqs.length - 1;

  let cursorPercent = 100;
  for (let i = 0; i < segmentCount; i += 1) {
    const from = milestoneSeqs[i];
    // The last segment includes the goal level's own topics.
    const to = i === segmentCount - 1 ? milestoneSeqs[i + 1] + 1 : milestoneSeqs[i + 1];
    const topics = scopedLevels
      .filter((lvl) => {
        const seq = resolveLevelMeta(lvl.code).sequence;
        return seq >= from && seq < to;
      })
      .flatMap((lvl) => lvl.modules.flatMap((m) => m.topics));
    const done = topics.filter((topic) => topic.studied).length;
    if (topics.length > 0 && done < topics.length) {
      cursorPercent = Math.round(((i + done / topics.length) / segmentCount) * 1000) / 10;
      break;
    }
  }

  // Current level code for floating pin
  const currentLevelCode = passport.ladder.find((s) => s.state === 'current')?.code || child.level;

  /* Real exam score per rung — the rung code is the module code, and the
     score comes from the child's genuine exam records. */
  const modulesByCode = new Map<string, CurriculumModule>();
  levels.forEach((lvl) => lvl.modules.forEach((m) => modulesByCode.set(m.code, m)));

  function rungScore(code: string): number | null {
    const module = modulesByCode.get(code);
    if (!module) return null;
    return moduleExam(module, child)?.score ?? null;
  }

  // Single real forecast — no simulated scenarios.
  const { forecast, pace } = passport;
  const isLate = forecast.verdict === 'behind';
  const verdictColor = isLate
    ? 'text-rose-600 dark:text-rose-400'
    : forecast.verdict === 'tight'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400';

  /* Status aura — the card border breathes in the verdict color:
     late = neon rose, tight = amber, on track = emerald. */
  const verdictRgb = isLate
    ? '244 63 94'
    : forecast.verdict === 'tight'
    ? '245 158 11'
    : '16 185 129';
  const auraStyle = {
    borderColor: `rgb(${verdictRgb} / ${ui.dark ? 0.55 : 0.45})`,
    '--va-soft': `rgb(${verdictRgb} / ${ui.dark ? 0.16 : 0.1})`,
    '--va-mid': `rgb(${verdictRgb} / ${ui.dark ? 0.28 : 0.18})`,
    '--va-strong': `rgb(${verdictRgb} / ${ui.dark ? 0.4 : 0.26})`
  } as React.CSSProperties;

  /* Production copy — one calm sentence about the outcome, one about the
     next step. No arrows, no jargon. */
  const lateMonths = Math.max(1, Math.abs(forecast.deltaMonths));
  const verdictMessage = isLate
    ? isParent
      ? `O‘qish rejadagidan ${lateMonths} oy kechroq tugashi mumkin. Muntazam davomat bu farqni qisqartiradi.`
      : `O‘qish rejadagidan ${lateMonths} oy kechroq tugashi mumkin. Darslarni qoldirmasang, bu farqni qoplab bo‘ladi.`
    : forecast.verdict === 'tight'
    ? isParent
      ? 'Maqsadga o‘z vaqtida yetib boradi — hozirgi sur‘atni saqlash muhim.'
      : 'Ayni vaqtida yetib borasan — har bir dars muhim, sur‘atni saqla!'
    : isParent
    ? 'Hammasi rejaga muvofiq — maqsadga o‘z vaqtida yetib boradi.'
    : 'Ajoyib ketyapsan! Shu sur‘atda maqsadga o‘z vaqtida yetasan.';

  // SVG Circular Gauge calculations
  const circumference = 2 * Math.PI * 38; // r = 38 => ~238.76
  const strokeDashoffset = circumference * (1 - pace.attendanceRate / 100);

  return (
    <div className="space-y-5 px-4 pb-1 pt-1">
      {/* ── 1. SIGNATURE BLUE HERO PROGRESS CARD (WITH NEON GLOW PROGRESS) ── */}
      <div
        className="relative min-h-[160px] overflow-hidden rounded-3xl p-5 text-white backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.4)] dark:border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.76) 0%, rgba(59, 130, 246, 0.70) 35%, rgba(96, 165, 250, 0.64) 70%, rgba(147, 197, 253, 0.58) 100%)'
        }}
      >
        {/* Top-down subtle specular glass sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent" />

        {/* Soft ambient inner glows */}
        <div className="pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-xl" />
        <div className="pointer-events-none absolute -right-2 -bottom-2 h-44 w-44 rounded-full bg-white/25 blur-2xl" />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col pr-28 sm:pr-32">
          {/* Top Row: Level Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 font-sans text-xs font-bold text-white backdrop-blur-sm shadow-sm">
              {t.pgCurrentLevelBadge(child.level)}
            </span>
          </div>

          {/* Large Progress Percentage */}
          <p className="mt-2.5 font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none text-white">
            {passport.now.percent}%
          </p>
          <p className="mt-1 font-sans text-xs font-medium text-white/85">
            {t.pgOverallMastery}
          </p>

          {/* Topics Fraction & Animated Progress Bar */}
          <div className="mt-3 w-full">
            <div className="mb-1 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-white/90">
              <span>{t.topicsProgress(passport.now.topicsDone, passport.now.topicsTotal)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-xs p-0.5">
              <div
                className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-all duration-700 ease-out"
                style={{ width: `${passport.now.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3D Student Passport / Diploma Asset */}
        <div
          className="pointer-events-none absolute -bottom-2 -right-2 z-10 flex h-36 w-36 shrink-0 items-center justify-center"
          style={{ transform: 'rotate(-4deg)' }}
        >
          <img
            src={ASSETS_3D.passport3d}
            alt="Progress"
            className="h-full w-full object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.25)]"
          />
        </div>
      </div>

      {/* ── 2. ALOHIDA KARTA: AKADEMIK MAQSAD (MATHEMATICAL RULER & BLINKING CURSOR) ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
            {t.pgAcademicGoal}
          </h3>
          <span className="font-sans text-xs font-semibold text-mutedfg">
            {t.pgTopicsRemaining(passport.remaining.topics)}
          </span>
        </div>

        <div
          onClick={() => {
            haptic('light');
            setGoalExpanded((prev) => !prev);
          }}
          className="cursor-pointer space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate font-sans text-sm font-bold text-foreground">
                {passport.goal.title}
              </h4>
              <p className="mt-0.5 font-sans text-xs text-mutedfg">
                {t.pgRequiredLevel(passport.goal.requiredLevelCode, passport.goal.targetDateFormatted)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <p className="font-display text-2xl font-black tabular-nums leading-none text-foreground">
                {passport.now.percent}%
              </p>
              <ChevronDownIcon
                size={16}
                className={[
                  'text-slate-400 transition-transform duration-200',
                  goalExpanded ? 'rotate-180' : ''
                ].join(' ')}
              />
            </div>
          </div>

          {/* Equal-interval ruler: clean pin, one filled track, 5 aligned ticks */}
          <div className="relative select-none pb-2 pt-7">
            {/* Floating level pin — a pill and a short stem, nothing more */}
            <div
              className="absolute top-0 z-20 flex flex-col items-center transition-all duration-700 ease-out"
              style={{ left: `${cursorPercent}%`, transform: 'translateX(-50%)' }}
            >
              <div className="flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 font-sans text-[10px] font-bold text-white shadow-sm">
                <span>{currentLevelCode}</span>
              </div>
              <div className="h-2.5 w-[2px] rounded-full bg-blue-600 dark:bg-blue-400" />
            </div>

            {/* Track — the fill always meets the pin */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="neon-progress-bar h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${cursorPercent}%` }}
              />
            </div>

            {/* Exactly 5 ruler ticks at equal intervals */}
            <div className="relative mt-1.5 h-1.5 w-full">
              {[0, 25, 50, 75, 100].map((p) => (
                <span
                  key={p}
                  style={{ left: `${p}%` }}
                  className={[
                    'absolute top-0 h-full w-[2px] rounded-full bg-slate-300 dark:bg-slate-600',
                    p === 0 ? '' : p === 100 ? '-translate-x-full' : '-translate-x-1/2'
                  ].join(' ')}
                />
              ))}
            </div>

            {/* Milestone labels, aligned with the ticks */}
            <div className="relative mt-1 h-4 w-full">
              {milestoneCodes.map((code, index) => {
                const position = (index / segmentCount) * 100;
                const isGoal = index === milestoneCodes.length - 1;
                return (
                  <span
                    key={code}
                    style={
                      index === 0
                        ? undefined
                        : isGoal
                        ? undefined
                        : { left: `${position}%`, transform: 'translateX(-50%)' }
                    }
                    className={[
                      'absolute text-[11px]',
                      index === 0 ? 'left-0' : '',
                      isGoal ? 'right-0 font-bold text-foreground' : 'font-semibold text-mutedfg'
                    ].join(' ')}
                  >
                    {code}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Detailed ladder — opens on tap; every completed rung shows its
              real exam score, so a separate exams list is unnecessary. */}
          {goalExpanded && (
            <div className="accordion-in space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center justify-between font-sans text-xs font-semibold text-mutedfg">
                <span>{t.pgCurrentStage(`${passport.now.levelCode} ${passport.now.levelTitle}`)}</span>
                <span>{t.pgTargetStage(passport.goal.requiredLevelCode)}</span>
              </div>

              <div className="no-scrollbar max-h-72 space-y-1.5 overflow-y-auto">
                {passport.ladder.map((step) => {
                  const score = step.state === 'completed' ? rungScore(step.code) : null;
                  return (
                    <div
                      key={step.sequence}
                      className={[
                        'flex items-center justify-between gap-3 rounded-xl px-3 py-2 font-sans text-xs',
                        step.state === 'current'
                          ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : step.state === 'completed'
                          ? 'bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : step.state === 'goal'
                          ? 'font-semibold text-amber-700 dark:text-amber-400'
                          : 'text-slate-400 dark:text-slate-500'
                      ].join(' ')}
                    >
                      <span className="min-w-0 truncate">
                        {step.sequence}. {step.code} — {step.title}
                      </span>
                      <span
                        className={[
                          'shrink-0 tabular-nums',
                          step.state === 'completed' ? 'font-bold' : ''
                        ].join(' ')}
                      >
                        {step.state === 'completed'
                          ? score !== null
                            ? t.pgBall(score)
                            : t.pgStepCompleted
                          : step.state === 'current'
                          ? t.pgStepCurrent
                          : step.state === 'goal'
                          ? t.pgStepGoal
                          : t.pgStepPending}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. BITIRUV PROGNOZI (ANIMATED CIRCULAR GAUGE & DUAL TIMELINE) ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
            {t.pgGraduationForecast}
          </h3>
        </div>

        <div
          className="verdict-aura space-y-4 rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900 sm:p-6"
          style={auraStyle}
        >
          {/* One real answer: with the current pace, when does study finish? */}
          <div className="flex items-center justify-between gap-4 pb-1">
            {/* SVG Circular Ring Chart */}
            <div className="relative flex shrink-0 items-center justify-center">
              <svg width="84" height="84" viewBox="0 0 88 88" className="-rotate-90">
                <defs>
                  <linearGradient id="ringNeonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                  <linearGradient id="ringNeonEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>

                {/* Track Background */}
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  fill="none"
                  strokeWidth="8"
                  className="stroke-slate-100 dark:stroke-slate-800"
                />

                {/* Animated Gradient Fill Ring without shadow */}
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke={isLate ? 'url(#ringNeonBlue)' : 'url(#ringNeonEmerald)'}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Text Inside Circular Ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-base font-black tabular-nums leading-none text-foreground">
                  {pace.attendanceRate}%
                </span>
                <span className="mt-0.5 font-sans text-[9px] font-semibold uppercase tracking-wider text-mutedfg">
                  {t.statAttendance}
                </span>
              </div>
            </div>

            {/* Right Side: Milestone Date & Outcome */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-xs font-bold',
                    isLate
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      : forecast.verdict === 'tight'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  ].join(' ')}
                >
                  {forecast.verdictText}
                </span>
              </div>

              <p className="font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {forecast.forecastDateFormatted}
              </p>

              <p className="font-sans text-xs text-mutedfg truncate">
                {t.pgPlanSchedule(t.pgTab3Lessons)}
              </p>
            </div>
          </div>

          {/* Completion timeline — study progress toward the finish date */}
          <div className="space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-semibold text-mutedfg">
                {t.pgCompletionTrack}
              </span>
              <span className={['font-sans font-bold tabular-nums', verdictColor].join(' ')}>
                {forecast.forecastDateFormatted}
              </span>
            </div>

            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={[
                  'h-full rounded-full transition-all duration-500 ease-out',
                  isLate
                    ? 'bg-rose-500'
                    : forecast.verdict === 'tight'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                ].join(' ')}
                style={{ width: `${passport.now.percent}%` }}
              />
            </div>
          </div>

          {/* Clean production copy — the outcome and the next step */}
          <p className="border-t border-slate-100 pt-3 font-sans text-xs leading-relaxed text-mutedfg dark:border-slate-800">
            {verdictMessage}
          </p>
        </div>
      </section>

      {/* ── 4. PARENT-ONLY: KECHIKISH SABABLARI ── */}
      {isParent && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
              {t.pgCausesTitle}
            </h3>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800/90 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-sans text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                A
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-xs font-bold text-foreground">
                  {t.pgCausePlan(passport.causes.planWeeks, passport.causes.planMonths)}
                </p>
                <p className="font-sans text-[11px] text-mutedfg">
                  {t.pgCausePlanDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-sans text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                B
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-xs font-bold text-foreground">
                  {t.pgCauseAtt(passport.causes.attendanceWeeks, passport.causes.attendanceMonths)}
                </p>
                <p className="font-sans text-[11px] text-mutedfg">
                  {t.pgCauseAttDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-sans text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                C
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-xs font-bold text-foreground">
                  {t.pgCauseHard(passport.causes.overrunLessons)}
                </p>
                <p className="font-sans text-[11px] text-mutedfg">
                  {t.pgCauseHardDesc}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. DARAJALAR BO'YICHA NATIJALAR ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
            {t.pgLevelsListTitle}
          </h3>
          <span className="font-sans text-xs font-semibold tabular-nums text-mutedfg">
            {t.pgAvgScore(passport.avgScore)}
          </span>
        </div>

        <CollapsibleLevelBands levels={levels} child={child} />
      </section>
    </div>
  );
}
