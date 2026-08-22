import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useCurriculum } from '../useCurriculum';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, LockIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { t } from '../strings';
import { haptic, getLevel3DAsset } from '../tokens';
import {
  levelAccess,
  levelProgress,
  moduleAccess,
  moduleProgress,
  curriculumProgress,
  currentPosition
} from '../access';
import { curriculumFor } from '../curriculum';
import type { CurriculumLevel, CurriculumModule } from '../curriculum';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { LevelDetail } from '../screens/LevelDetail';
import { ModuleDetail } from '../screens/ModuleDetail';

/** Dynamic Level configuration for the entire school hierarchy */
const BAND_CONFIGS: Record<string, { name: string; subtitle: string }> = {
  A: { name: 'Level A', subtitle: "Boshlang'ich" },
  B: { name: 'Level B', subtitle: "O'rta" },
  C: { name: 'Level C', subtitle: 'Xalqaro & SAT' },
  D: { name: 'Level D', subtitle: 'Olimpiada' },
  E: { name: 'Level E', subtitle: 'Oliy' },
};

export function CurriculumBrowser({ child }: { child: ChildRecord }) {
  const ui = useUI();
  const allLevels = useCurriculum();
  const overall = useMemo(() => curriculumProgress(allLevels), [allLevels]);
  const position = useMemo(() => currentPosition(allLevels), [allLevels]);

  // Extract all unique Bands/Levels present in the curriculum dynamically
  const availableBands = useMemo(() => {
    const set = new Set<string>();
    for (const lvl of allLevels) {
      const letter = lvl.code.charAt(0).toUpperCase();
      if (letter) set.add(letter);
    }
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['A', 'B', 'C', 'D', 'E'];
  }, [allLevels]);

  // Active student current level and initial band
  const liveLevelCode = position?.level.code || allLevels[0]?.code || 'A1';
  const liveBand = liveLevelCode.charAt(0).toUpperCase() || 'A';

  const [selectedBand, setSelectedBand] = useState<string>(liveBand);

  // Filter levels for the currently active Band (e.g. A1, A2, A3)
  const bandLevels = useMemo(() => {
    const filtered = allLevels.filter((lvl) => lvl.code.toUpperCase().startsWith(selectedBand));
    return filtered.length > 0 ? filtered : allLevels;
  }, [allLevels, selectedBand]);

  // Active swiper index within the current Band
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Default to current live level if in this band, otherwise first level
  useEffect(() => {
    const currentInBandIdx = bandLevels.findIndex((l) => levelAccess(allLevels, l) === 'current');
    setActiveIndex(currentInBandIdx >= 0 ? currentInBandIdx : 0);
  }, [selectedBand, bandLevels, allLevels]);

  // Story avatars scroll container ref
  const storiesScrollRef = useRef<HTMLDivElement | null>(null);

  // Touch / pointer gesture physics state
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const isDragging = useRef<boolean>(false);
  const pointerIdRef = useRef<number | null>(null);

  if (allLevels.length === 0) {
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
      node: <ModuleDetail child={child} levels={allLevels} level={level} module={module} />
    });
  }

  const goToIndex = useCallback((newIdx: number) => {
    if (newIdx < 0 || newIdx >= bandLevels.length) return;
    haptic('light');
    setActiveIndex(newIdx);
  }, [bandLevels.length]);

  function handleSwipeLeft() {
    if (activeIndex < bandLevels.length - 1) {
      goToIndex(activeIndex + 1);
    }
  }

  function handleSwipeRight() {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  }

  // 60/120fps Hardware-Accelerated Gesture Handlers
  function onPointerDown(e: React.PointerEvent) {
    touchStartX.current = e.clientX;
    touchStartTime.current = performance.now();
    isDragging.current = true;
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current || touchStartX.current === null) return;
    const rawDelta = e.clientX - touchStartX.current;
    
    // Apple rubber-band resistance if dragging past first or last card
    const isAtStart = activeIndex === 0 && rawDelta > 0;
    const isAtEnd = activeIndex === bandLevels.length - 1 && rawDelta < 0;
    
    const delta = isAtStart || isAtEnd ? rawDelta * 0.35 : rawDelta;
    setDragOffset(delta);
  }

  function onPointerEnd(e: React.PointerEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const delta = dragOffset;
    const duration = Math.max(1, performance.now() - touchStartTime.current);
    const velocity = Math.abs(delta) / duration; // px per ms

    setDragOffset(0);

    try {
      if (pointerIdRef.current !== null) {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      }
    } catch {
      // safe fallback
    }

    // Velocity-sensitive flick or displacement threshold
    const isQuickFlick = velocity > 0.45 && Math.abs(delta) > 20;
    const isSufficientDrag = Math.abs(delta) > 42;

    if (isQuickFlick || isSufficientDrag) {
      if (delta < 0) {
        handleSwipeLeft();
      } else {
        handleSwipeRight();
      }
    }

    touchStartX.current = null;
    touchStartTime.current = 0;
    pointerIdRef.current = null;
  }

  const activeLevel = bandLevels[activeIndex] || bandLevels[0];
  const activeLevelProgress = levelProgress(activeLevel);

  // Normalized drag progress (0 to 1) for real-time background parallax
  const dragProgress = Math.min(1, Math.abs(dragOffset) / 180);

  return (
    <div className="space-y-3 px-3.5 pb-6 pt-0">
      {/* ── Instagram Story-Style Level Avatars with Apple Springs ── */}
      <div
        ref={storiesScrollRef}
        className="flex items-center gap-4 overflow-x-auto px-1 py-1 no-scrollbar scroll-smooth"
      >
        {availableBands.map((band) => {
          const isSelected = selectedBand === band;
          const bandLevelsList = allLevels.filter((lvl) => lvl.code.toUpperCase().startsWith(band));
          
          const isBandCompleted = bandLevelsList.length > 0 && bandLevelsList.every(
            (lvl) => levelAccess(allLevels, lvl) === 'completed'
          );
          const isBandCurrent = bandLevelsList.some(
            (lvl) => levelAccess(allLevels, lvl) === 'current'
          );

          const cfg = BAND_CONFIGS[band] || { name: `Level ${band}`, subtitle: `Daraja ${band}` };

          return (
            <button
              key={band}
              type="button"
              onClick={() => {
                haptic('light');
                setSelectedBand(band);
              }}
              className="group flex flex-col items-center gap-1.5 shrink-0 transition-transform duration-200 ease-out active:scale-90"
            >
              {/* Instagram Story Gradient Ring Avatar */}
              <div
                className={[
                  'relative flex h-[58px] w-[58px] items-center justify-center rounded-full p-[2.5px] transition-all duration-300 ease-out',
                  isSelected
                    ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 shadow-md ring-2 ring-blue-500/30 ring-offset-2 dark:ring-offset-slate-950'
                    : isBandCurrent
                    ? 'bg-gradient-to-tr from-blue-500 to-indigo-400 shadow-sm opacity-90'
                    : isBandCompleted
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                    : 'bg-slate-200 dark:bg-slate-800 opacity-60'
                ].join(' ')}
              >
                {/* Inner Circle with Bold Letter */}
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-inner">
                  <span className={[
                    'font-display text-lg font-bold transition-colors duration-200',
                    isSelected
                      ? 'text-blue-600 dark:text-blue-400'
                      : isBandCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isBandCurrent
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  ].join(' ')}>
                    {band}
                  </span>
                </div>

                {/* Mini Status Badge at bottom-right of Story Avatar */}
                <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900">
                  {isBandCompleted ? (
                    <CheckIcon size={10} strokeWidth={3.5} className="text-emerald-500" />
                  ) : isBandCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  ) : (
                    <LockIcon size={9} className="text-slate-400" />
                  )}
                </div>
              </div>

              {/* Level Label & Subtitle */}
              <div className="flex flex-col items-center">
                <span className={[
                  'font-sans text-[11px] font-bold tracking-tight transition-colors duration-200',
                  isSelected
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300'
                ].join(' ')}>
                  {cfg.name}
                </span>
                <span className="font-sans text-[9px] text-mutedfg leading-tight">
                  {cfg.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 3. Interactive 3D Stacked Card Deck with Fluid Parallax Physics ── */}
      <div className="relative pt-1">
        {/* Card Deck Container */}
        <div
          className="relative h-[160px] w-full touch-pan-y select-none"
          style={{ perspective: '1000px' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {bandLevels.map((level, idx) => {
            const state = levelAccess(allLevels, level);
            const isCompleted = state === 'completed';
            const isCurrent = state === 'current';
            const isLocked = state === 'locked';

            const total = bandLevels.length;
            const diff = (idx - activeIndex + total) % total;

            // Strictly render only the top 3 cards in the deck stack (diff 0, 1, 2)
            if (diff !== 0 && diff !== 1 && diff !== 2) return null;

            const isTop = diff === 0;
            const isSecond = diff === 1;
            const isThird = diff === 2;

            const gradientBg = isCompleted
              ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.76) 0%, rgba(59, 130, 246, 0.70) 35%, rgba(96, 165, 250, 0.64) 70%, rgba(147, 197, 253, 0.58) 100%)'
              : isCurrent
              ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.78) 0%, rgba(99, 102, 241, 0.72) 35%, rgba(129, 140, 248, 0.64) 70%, rgba(199, 210, 254, 0.58) 100%)'
              : 'linear-gradient(135deg, rgba(71, 85, 105, 0.74) 0%, rgba(100, 116, 139, 0.66) 45%, rgba(148, 163, 184, 0.55) 100%)';

            const asset3D = getLevel3DAsset(level.code);
            const progress = levelProgress(level);

            // Real-time Parallax calculations during drag
            let transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
            let zIndex = 30;
            let opacity = 1;

            if (isTop) {
              const dragRotate = dragOffset * 0.038;
              transform = `translate3d(${dragOffset}px, 0, 0) rotate(${dragRotate}deg) scale(1)`;
              zIndex = 30;
              opacity = 1;
            } else if (isSecond) {
              const currentScale = 0.94 + dragProgress * 0.06;
              const currentY = 10 - dragProgress * 10;
              const currentRotate = -2.0 + dragProgress * 2.0;
              transform = `translate3d(0, ${currentY}px, 0) scale(${currentScale}) rotate(${currentRotate}deg)`;
              zIndex = 20;
              opacity = 0.65 + dragProgress * 0.35;
            } else if (isThird) {
              const currentScale = 0.88 + dragProgress * 0.06;
              const currentY = 20 - dragProgress * 10;
              const currentRotate = 2.5 - dragProgress * 2.0;
              transform = `translate3d(0, ${currentY}px, 0) scale(${currentScale}) rotate(${currentRotate}deg)`;
              zIndex = 10;
              opacity = 0.35 + dragProgress * 0.30;
            }

            return (
              <div
                key={level.id}
                style={{
                  transform,
                  zIndex,
                  opacity,
                  transition: isDragging.current && isTop
                    ? 'none'
                    : 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 360ms cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
                className="absolute inset-x-0 top-0 transform-gpu"
              >
                <div
                  onClick={() => {
                    if (isTop && !isLocked) {
                      openLevel(level);
                    } else if (!isTop) {
                      goToIndex(idx);
                    }
                  }}
                  className={[
                    'relative flex min-h-[152px] w-full items-center justify-between rounded-2xl text-white transition-all duration-200 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.4)] dark:border-white/20',
                    isTop ? 'cursor-pointer active:scale-[0.985]' : 'pointer-events-auto cursor-pointer'
                  ].join(' ')}
                >
                  {/* Background card with rounded corners & ambient lighting */}
                  <div
                    className="absolute inset-0 overflow-hidden rounded-2xl"
                    style={{ background: gradientBg }}
                  >
                    {/* Top-down subtle specular glass sheen */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent" />

                    {/* Soft ambient inner glow on left */}
                    <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/20 blur-xl" />

                    {/* Luminous soft highlight on right behind 3D asset */}
                    <div className="pointer-events-none absolute -bottom-2 -right-2 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
                  </div>

                  {/* Draped Flag Ribbon flush with the top edge of the card (only on top active card) */}
                  {isTop && (
                    <div className="pointer-events-none absolute right-4 top-0 z-20 sm:right-6">
                      <div
                        className={[
                          'animate-flag-wind-x flex items-center justify-center border-b border-x px-3 py-1.5 shadow-md',
                          isCompleted
                            ? 'border-emerald-400/40 bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-emerald-950/25'
                            : isCurrent
                            ? 'border-blue-400/40 bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-700 text-white shadow-blue-950/25'
                            : 'border-slate-400/40 bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-slate-950/25'
                        ].join(' ')}
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)',
                          minWidth: '86px'
                        }}
                      >
                        <div className="flex items-center gap-1 font-sans text-[10px] font-bold tracking-tight pb-1 pt-0.5">
                          {isCompleted ? (
                            <>
                              <CheckIcon size={11} strokeWidth={3.5} className="shrink-0 text-white" />
                              <span>Yakunlangan</span>
                            </>
                          ) : isCurrent ? (
                            <>
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300 animate-pulse" />
                              <span>Joriy</span>
                            </>
                          ) : (
                            <>
                              <LockIcon size={10} className="shrink-0 text-white/90" />
                              <span>Qulflangan</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Left content with room for 3D illustration on the right (hidden on background cards to prevent text bleed) */}
                  <div
                    className={[
                      'relative z-10 flex min-w-0 flex-1 flex-col p-5 pr-28 sm:pr-32 transition-opacity duration-200',
                      isTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    ].join(' ')}
                  >
                    <span className="font-display text-2xl font-bold tracking-tight text-white">
                      {level.code}
                    </span>

                    <span className="mt-1 block truncate font-sans text-base font-semibold text-white">
                      {level.title}
                    </span>

                    {/* Progress bar with space-between numbers */}
                    <div className="mt-4 w-full">
                      <div className="mb-1.5 flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-white/90">
                        <span>
                          {progress.done} / {progress.total} mavzu
                        </span>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                        <div
                          className="bar-fill h-full rounded-full bg-white shadow-sm transition-all duration-500 ease-out"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right 3D Visual Asset — 100% Crystal-Clear Transparent PNG */}
                  {asset3D && (
                    <div className="pointer-events-none absolute -bottom-4 -right-4 z-20 flex h-32 w-32 shrink-0 items-center justify-center sm:-right-2 sm:h-36 sm:w-36">
                      <img
                        src={asset3D}
                        alt={level.title}
                        className="h-full w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Left Floating Apple Glass Arrow (Vertically Centered on Card Edge) */}
          <button
            type="button"
            onClick={handleSwipeRight}
            disabled={activeIndex === 0}
            aria-label="Oldingi daraja"
            className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-800 backdrop-blur-md shadow-md border border-white/60 transition-all duration-200 hover:scale-105 active:scale-90 disabled:opacity-0 disabled:pointer-events-none dark:bg-slate-900/80 dark:text-white dark:border-white/10"
          >
            <ChevronLeftIcon size={16} strokeWidth={2.5} />
          </button>

          {/* Right Floating Apple Glass Arrow (Vertically Centered on Card Edge) */}
          <button
            type="button"
            onClick={handleSwipeLeft}
            disabled={activeIndex === bandLevels.length - 1}
            aria-label="Keyingi daraja"
            className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-800 backdrop-blur-md shadow-md border border-white/60 transition-all duration-200 hover:scale-105 active:scale-90 disabled:opacity-0 disabled:pointer-events-none dark:bg-slate-900/80 dark:text-white dark:border-white/10"
          >
            <ChevronRightIcon size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Swiper Pagination Indicator Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {bandLevels.map((_, dotIdx) => {
            const isDotActive = dotIdx === activeIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => goToIndex(dotIdx)}
                aria-label={`Slide ${dotIdx + 1}`}
                className={[
                  'h-2 rounded-full transition-all duration-300 cubic-bezier(0.32, 0.72, 0, 1)',
                  isDotActive
                    ? 'w-6 bg-primary shadow-sm'
                    : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>

      {/* ── 4. Sub-Modules / Rungs List for Active Selected Level ── */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="text-primary font-bold">{activeLevel.code}</span> Modullari
          </h3>
          <span className="font-sans text-xs font-medium tabular-nums text-mutedfg">
            {activeLevelProgress.done} / {activeLevelProgress.total} mavzu
          </span>
        </div>

        <div className="space-y-2.5">
          {activeLevel.modules.map((module) => (
            <ModuleSummaryCard
              key={module.id}
              levels={allLevels}
              module={module}
              onOpen={() => openModule(activeLevel, module)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 1x1 Direct Module Card with Apple Standards ──────────────── */

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
        'group relative flex w-full flex-col overflow-hidden rounded-2xl border px-4 pt-3.5 pb-4 text-left transition-all duration-200 ease-out shadow-sm',
        current
          ? 'border-blue-500/40 bg-white dark:bg-slate-900 ring-1 ring-blue-500/20'
          : 'border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-slate-900',
        locked
          ? 'opacity-55 cursor-not-allowed'
          : 'hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.985]'
      ].join(' ')}
    >
      {/* Draped Flag Ribbon at Top-Right */}
      {(completed || current) && (
        <div className="pointer-events-none absolute top-0 right-4 z-10">
          <div
            className={[
              'flex items-center justify-center px-2.5 py-1 shadow-sm border-b border-x',
              completed
                ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-400/40 shadow-emerald-950/20'
                : 'bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-700 text-white border-blue-400/40 shadow-blue-950/20'
            ].join(' ')}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)',
              minWidth: '82px'
            }}
          >
            <div className="flex items-center gap-1 font-sans text-[10px] font-bold tracking-tight pb-0.5 pt-0.5">
              {completed ? (
                <>
                  <CheckIcon size={10} strokeWidth={3.5} className="text-white shrink-0" />
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
      )}

      {/* Module Code */}
      <div className="flex items-center justify-between w-full pr-24">
        <span className="font-display text-base font-extrabold text-foreground dark:text-white tracking-tight">
          {module.code}
        </span>
      </div>

      {/* Module Title & Chevron */}
      <div className="mt-0.5 flex items-center justify-between w-full">
        <h4 className="font-sans text-sm sm:text-[15px] font-semibold text-foreground truncate pr-2">
          {module.title}
        </h4>
        <div className="shrink-0 flex items-center justify-center h-6 w-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {locked ? (
            <LockIcon size={14} className="text-mutedfg" />
          ) : (
            <ChevronRightIcon size={18} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </div>

      {/* Clean Full-Width Progress Section */}
      <div className="mt-3.5 w-full">
        <div className="flex items-center justify-between font-sans text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          <span>{progress.done} / {progress.total} mavzu</span>
          <span className={completed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : current ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
            {progress.percent}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={[
              'bar-fill h-full rounded-full transition-all duration-500 ease-out',
              completed
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : current
                ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]'
                : 'bg-slate-300 dark:bg-slate-700'
            ].join(' ')}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    </button>
  );
}
