import React from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { calculatePassport } from '../passport';
import { student } from '../mockData';
import { useUI } from '../ui';
import { haptic } from '../tokens';

export function GoalProgressDashboardCard() {
  const ui = useUI();
  const passport = calculatePassport(student);

  // Core Lesson Numbers
  const totalLessons = 216; // 72 topics * 3 lessons
  const lessonsDone = passport.totalLessonsAttended || 48;
  const lessonsRemaining = passport.remaining.lessons || 168;
  const percent = passport.now.percent || 22;

  // Extra Large Crisp SVG Ring Constants
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  function handleClick() {
    haptic('light');
    // Switch to Progress tab (index 3)
    ui.goToTab(3);
  }

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 text-left shadow-sm transition-all duration-200 ease-out hover:border-slate-300 active:scale-[0.99] dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      {/* ── 1. Header: Goal Title & Navigation Chevron ── */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-sans text-base sm:text-lg font-bold text-foreground">
          {passport.goal.title}
        </h3>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200 group-hover:text-foreground dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700">
          <ChevronRightIcon size={16} strokeWidth={2.4} />
        </div>
      </div>

      {/* ── 2. Direct Large Chart & Spacious Metrics (No nested div box) ── */}
      <div className="mt-4 flex items-center gap-5 sm:gap-6">
        {/* Large Crisp Circular Progress Gauge */}
        <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track Ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress Stroke Ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#largeGoalGradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="largeGoalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Info: Large Bold Percentage & Current Level */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl sm:text-[26px] font-black tracking-tight text-foreground leading-none">
              {percent}%
            </span>
            <span className="mt-1 font-sans text-xs font-bold text-blue-600 dark:text-blue-400 leading-none">
              {passport.now.levelCode}
            </span>
          </div>
        </div>

        {/* Right Side: Large Clear Typographic Numbers */}
        <div className="flex flex-1 flex-col justify-center space-y-3">
          {/* Lessons Done */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans text-xs sm:text-sm font-semibold text-mutedfg">
              O‘tilgan darslar:
            </span>
            <span className="font-display text-base sm:text-lg font-bold text-foreground tabular-nums">
              {lessonsDone} / {totalLessons}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

          {/* Lessons Remaining */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans text-xs sm:text-sm font-semibold text-mutedfg">
              Maqsadgacha qoldi:
            </span>
            <span className="font-display text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
              {lessonsRemaining} dars
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Clean Full-Width Progress Track ── */}
      <div className="mt-4 w-full">
        <div className="mb-1.5 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-mutedfg">
          <span>{lessonsDone} dars o‘tildi</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{lessonsRemaining} dars qoldi</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="neon-progress-bar h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
