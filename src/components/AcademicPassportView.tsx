import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-react';
import { haptic, ASSETS_3D } from '../tokens';
import { t } from '../strings';
import { calculatePassport } from '../passport';
import type { AcademicPassport } from '../passport';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { LevelDetail } from '../screens/LevelDetail';
import { NewBookingSheet } from '../screens/NewBookingSheet';
import { curriculumFor } from '../curriculum';
import type { CurriculumLevel } from '../curriculum';

interface AcademicPassportViewProps {
  child: ChildRecord;
  isParent?: boolean;
}

export function AcademicPassportView({ child, isParent = false }: AcademicPassportViewProps) {
  const ui = useUI();
  const passport: AcademicPassport = calculatePassport(child);
  const levels = curriculumFor(child.id);
  const [ladderExpanded, setLadderExpanded] = useState<boolean>(false);

  // Simulator tabs: 'standard', 'attendance', 'intensive'
  const [simMode, setSimMode] = useState<'standard' | 'attendance' | 'intensive'>('standard');

  function openLevel(level: CurriculumLevel) {
    haptic('light');
    ui.push({
      key: `level-${level.id}`,
      backTitle: t.tabProgress,
      node: <LevelDetail child={child} levelId={level.id} />
    });
  }

  function openBookingForWeakPoint(topic: string) {
    haptic('light');
    ui.openSheet({
      key: 'new-booking-weakpoint',
      detent: 'large',
      node: <NewBookingSheet initialPurpose={`${topic} — ${t.supportHeader.toLowerCase()}`} />
    });
  }

  // Dynamically compute mathematical level start positions for ruler accuracy
  const totalTopics = passport.now.topicsTotal > 0 ? passport.now.topicsTotal : 72;
  let cumTopics = 0;
  const levelMilestones: { code: string; percent: number }[] = [];

  levels.forEach((lvl, idx) => {
    const startTopics = cumTopics;
    const count = lvl.modules.reduce((sum, m) => sum + m.topics.length, 0);
    cumTopics += count;
    const percent = Math.round((startTopics / totalTopics) * 100);
    levelMilestones.push({
      code: lvl.code,
      percent: idx === 0 ? 0 : percent
    });
  });

  // Current level code for floating pin
  const currentLevelCode = passport.ladder.find((s) => s.state === 'current')?.code || child.level;

  const simData = {
    standard: {
      schedule: t.pgTab3Lessons,
      attendanceRate: 88,
      attendanceText: t.pgAttendanceRate(88),
      forecastDate: passport.forecast.forecastDateFormatted,
      isLate: true,
      badgeText: t.pgDelayMonths(8),
      deltaMonths: '8 oy',
      progressPercent: 70,
      gainText: null,
      tip: isParent ? t.pgTipStandardParent : t.pgTipStandardStudent
    },
    attendance: {
      schedule: t.pgTab3Lessons,
      attendanceRate: 90,
      attendanceText: t.pgAttendanceRate(90),
      forecastDate: '2027-oktabr',
      isLate: true,
      badgeText: t.pgDelayMonths(4),
      deltaMonths: '4 oy',
      progressPercent: 62,
      gainText: t.pgSavedMonths(4),
      tip: isParent ? t.pgTipAttParent : t.pgTipAttStudent
    },
    intensive: {
      schedule: t.pgTabIntensive,
      attendanceRate: 95,
      attendanceText: t.pgAttendanceRate(95),
      forecastDate: '2027-may',
      isLate: false,
      badgeText: t.pgOnTimeAhead,
      deltaMonths: '1 oy oldin',
      progressPercent: 54,
      gainText: t.pgGoalFullReach,
      tip: isParent ? t.pgTipIntParent : t.pgTipIntStudent
    }
  }[simMode];

  // SVG Circular Gauge calculations
  const circumference = 2 * Math.PI * 38; // r = 38 => ~238.76
  const strokeDashoffset = circumference * (1 - simData.attendanceRate / 100);

  return (
    <div className="space-y-5 px-4 pb-20 pt-1">
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

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate font-sans text-sm font-bold text-foreground">
                {passport.goal.title}
              </h4>
              <p className="mt-0.5 font-sans text-xs text-mutedfg">
                {t.pgRequiredLevel(passport.goal.requiredLevelCode, passport.goal.targetDateFormatted)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-black tabular-nums leading-none text-foreground">
                {passport.now.percent}%
              </p>
            </div>
          </div>

          {/* Interactive Ruler Progress Track with Blinking Cursor & Floating Level Pin */}
          <div className="relative pt-7 pb-2 select-none">
            {/* Floating Level Badge + Blinking Typing Cursor Indicator */}
            <div
              className="absolute top-0 z-20 flex flex-col items-center transition-all duration-700 ease-out"
              style={{ left: `${passport.now.percent}%`, transform: 'translateX(-50%)' }}
            >
              {/* Floating Level Capsule — Level Name Only */}
              <div className="flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 font-sans text-[10px] font-bold text-white shadow-sm">
                <span>{currentLevelCode}</span>
              </div>
              {/* Downward Caret */}
              <div className="h-1 w-1.5 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-blue-600" />
              {/* Glowing Blinking Cursor '|' */}
              <div className="h-4 w-0.5 rounded-full bg-blue-600 animate-pulse dark:bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            </div>

            {/* Progress Track & Mathematically Aligned Level Ticks */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {/* Filled Neon Bar */}
              <div
                className="neon-progress-bar h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${passport.now.percent}%` }}
              />

              {/* Dynamic Level Boundary Ticks */}
              <div className="pointer-events-none absolute inset-0">
                {levelMilestones.map((m) => (
                  m.percent > 0 && m.percent < 100 && (
                    <div
                      key={m.code}
                      style={{ left: `${m.percent}%` }}
                      className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-slate-300 dark:bg-slate-700"
                    />
                  )
                ))}
              </div>
            </div>

            {/* Mathematically Positioned Milestone Labels */}
            <div className="relative mt-2.5 h-4 w-full">
              {/* A1 (0%) */}
              <button
                type="button"
                onClick={() => haptic('light')}
                className="absolute left-0 text-[11px] font-semibold text-mutedfg hover:text-foreground transition-colors"
              >
                A1
              </button>

              {/* A2 (at start of A2: 21%) */}
              <button
                type="button"
                onClick={() => haptic('light')}
                style={{ left: `${levelMilestones[1]?.percent || 21}%`, transform: 'translateX(-50%)' }}
                className="absolute text-[11px] font-semibold text-mutedfg hover:text-foreground transition-colors"
              >
                A2
              </button>

              {/* B1 (at start of B1: 40%) */}
              <button
                type="button"
                onClick={() => haptic('light')}
                style={{ left: `${levelMilestones[3]?.percent || 40}%`, transform: 'translateX(-50%)' }}
                className="absolute text-[11px] font-semibold text-mutedfg hover:text-foreground transition-colors"
              >
                B1
              </button>

              {/* B2 (at start of B2: 49%) */}
              <button
                type="button"
                onClick={() => haptic('light')}
                style={{ left: `${levelMilestones[4]?.percent || 49}%`, transform: 'translateX(-50%)' }}
                className="absolute text-[11px] font-semibold text-mutedfg hover:text-foreground transition-colors"
              >
                B2
              </button>

              {/* C-DTM (Goal Target: 100%) */}
              <button
                type="button"
                onClick={() => haptic('light')}
                className="absolute right-0 text-[11px] font-bold text-foreground hover:text-primary transition-colors"
              >
                {passport.goal.requiredLevelCode}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. BITIRUV PROGNOZI (ANIMATED CIRCULAR GAUGE & DUAL TIMELINE) ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
            {t.pgGraduationForecast}
          </h3>
          {simData.gainText && (
            <span className="font-sans text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {simData.gainText}
            </span>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900 space-y-4.5">
          {/* Interactive Mode Action Pills — Minimal 1-line Apple buttons */}
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                haptic('light');
                setSimMode('standard');
              }}
              className={[
                'rounded-xl py-2 px-1 text-center font-sans text-xs font-bold transition-all',
                simMode === 'standard'
                  ? 'bg-white text-foreground shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-mutedfg hover:text-foreground'
              ].join(' ')}
            >
              {t.pgModeStandard}
            </button>

            <button
              type="button"
              onClick={() => {
                haptic('light');
                setSimMode('attendance');
              }}
              className={[
                'rounded-xl py-2 px-1 text-center font-sans text-xs font-bold transition-all',
                simMode === 'attendance'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-mutedfg hover:text-foreground'
              ].join(' ')}
            >
              {t.pgModeAttendance}
            </button>

            <button
              type="button"
              onClick={() => {
                haptic('light');
                setSimMode('intensive');
              }}
              className={[
                'rounded-xl py-2 px-1 text-center font-sans text-xs font-bold transition-all',
                simMode === 'intensive'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-mutedfg hover:text-foreground'
              ].join(' ')}
            >
              {t.pgModeIntensive}
            </button>
          </div>

          {/* Middle Row: Animated Circular Progress Ring + Key Milestone (With Generous pt-4 pb-2 padding) */}
          <div className="flex items-center justify-between gap-4 pt-4 pb-2">
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
                  stroke={simData.isLate ? 'url(#ringNeonBlue)' : 'url(#ringNeonEmerald)'}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Text Inside Circular Ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-base font-black tabular-nums leading-none text-foreground">
                  {simData.attendanceRate}%
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
                    simData.isLate
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  ].join(' ')}
                >
                  {simData.badgeText}
                </span>
              </div>

              <p className="font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {simData.forecastDate}
              </p>

              <p className="font-sans text-xs text-mutedfg truncate">
                {t.pgPlanSchedule(simData.schedule)}
              </p>
            </div>
          </div>

          {/* Visual Dual Timeline with Neon Glow */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Target Baseline */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-sans font-semibold text-mutedfg">
                  {t.pgTargetExam}
                </span>
                <span className="font-sans font-bold text-foreground">
                  2027-iyun
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-[60%] rounded-full bg-slate-400/70 dark:bg-slate-600" />
              </div>
            </div>

            {/* Dynamic Forecast Track — Clean without duplicate badge text */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-sans font-semibold text-mutedfg">
                  {t.pgCompletionTrack}
                </span>
                <span
                  className={[
                    'font-sans font-bold tabular-nums',
                    simData.isLate ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  ].join(' ')}
                >
                  {simData.forecastDate}
                </span>
              </div>

              {/* Animated Glowing Progress Bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-500 ease-out',
                    simData.isLate ? 'neon-progress-rose' : 'neon-progress-emerald'
                  ].join(' ')}
                  style={{ width: `${simData.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actionable Humanized Tip Footer */}
          <p className="font-sans text-xs leading-relaxed text-mutedfg border-t border-slate-100 pt-3 dark:border-slate-800">
            {simData.tip}
          </p>
        </div>
      </section>

      {/* ── 4. ALOHIDA KARTA: O'QUV NARVONI (21 POG'ONA) ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
            {t.pgLadderTitle}
          </h3>
          <button
            type="button"
            onClick={() => setLadderExpanded((prev) => !prev)}
            className="flex items-center gap-1 font-sans text-xs font-semibold text-primary"
          >
            <span>{ladderExpanded ? t.pgCollapse : t.pgExpandAll}</span>
            <ChevronDownIcon
              size={14}
              className={`transition-transform duration-200 ${ladderExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800/90 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-mutedfg pb-3 border-b border-slate-100 dark:border-slate-800">
            <span>{t.pgCurrentStage('A2.1 Foizlar')}</span>
            <span>{t.pgTargetStage('C-DTM (TATU)')}</span>
          </div>

          {/* Ladder Horizontal Rungs Bar — Clean Apple Nodes with safe py-3 padding */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 px-1 no-scrollbar">
            {passport.ladder.map((step) => {
              const isDone = step.state === 'completed';
              const isCurrent = step.state === 'current';
              const isGoal = step.state === 'goal';

              if (isCurrent) {
                return (
                  <div
                    key={step.sequence}
                    className="flex h-8 shrink-0 items-center justify-center rounded-full bg-blue-600 px-3 font-sans text-xs font-bold text-white shadow-sm ring-4 ring-blue-500/20 dark:ring-blue-400/20"
                  >
                    {step.code}
                  </div>
                );
              }

              if (isGoal) {
                return (
                  <div
                    key={step.sequence}
                    className="flex h-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-3 font-sans text-xs font-bold text-amber-950 shadow-xs"
                  >
                    {step.code}
                  </div>
                );
              }

              if (isDone) {
                return (
                  <div
                    key={step.sequence}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-sans text-[11px] font-bold text-white shadow-xs"
                  >
                    {step.code.split('.')[1] || step.code.slice(1)}
                  </div>
                );
              }

              return (
                <div
                  key={step.sequence}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-sans text-[11px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                >
                  {step.code.split('.')[1] || step.code.slice(1)}
                </div>
              );
            })}
          </div>

          {ladderExpanded && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-60 overflow-y-auto no-scrollbar slide-up-fade">
              {passport.ladder.map((step) => (
                <div
                  key={step.sequence}
                  className={[
                    'flex items-center justify-between p-2 rounded-xl text-xs font-sans',
                    step.state === 'current'
                      ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : step.state === 'completed'
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center">{step.sequence}.</span>
                    <span>{step.code} — {step.title}</span>
                  </div>
                  <span>
                    {step.state === 'completed'
                      ? t.pgStepCompleted
                      : step.state === 'current'
                      ? t.pgStepCurrent
                      : step.state === 'goal'
                      ? t.pgStepGoal
                      : t.pgStepPending}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. STUDENT-ONLY: «TUGATISH KERAK» (Weak Points) ── */}
      {!isParent && child.weakPoints && child.weakPoints.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
              {t.pgUnfinishedTopics(child.weakPoints.length)}
            </h3>
          </div>

          <div className="space-y-2">
            {child.weakPoints.map((wp) => (
              <div
                key={wp.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-sm font-bold text-foreground">
                    {wp.topic}
                  </p>
                  <p className="mt-0.5 font-sans text-xs text-mutedfg italic truncate">
                    «{wp.note}»
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openBookingForWeakPoint(wp.topic)}
                  className="shrink-0 inline-flex items-center justify-center rounded-xl bg-primary px-3.5 py-1.5 font-sans text-xs font-bold text-primaryfg shadow-xs transition-all duration-150 active:scale-95"
                >
                  {t.pgBookSupport}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. PARENT-ONLY: KECHIKISH SABABLARI ── */}
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

        <div className="space-y-2">
          {levels.map((lvl) => {
            const modTotal = lvl.modules.reduce((acc, m) => acc + m.topics.length, 0);
            const modDone = lvl.modules.reduce(
              (acc, m) => acc + m.topics.filter((t) => t.studied).length,
              0
            );
            const percent = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0;
            const isFinished = percent === 100;
            const isCurrent = percent > 0 && percent < 100;

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
                      isFinished
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

                {/* Full-Width Progress Track */}
                <div className="mt-3.5 w-full">
                  <div className="mb-1.5 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-mutedfg">
                    <span>
                      {modDone} / {modTotal} mavzu
                    </span>
                    <span
                      className={
                        isFinished
                          ? 'font-bold text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                          ? 'font-bold text-blue-600 dark:text-blue-400'
                          : ''
                      }
                    >
                      {percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={[
                        'bar-fill h-full rounded-full transition-all duration-500 ease-out',
                        isFinished
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      ].join(' ')}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
