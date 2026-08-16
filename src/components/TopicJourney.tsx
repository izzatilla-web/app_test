import React, { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronRightIcon,
  CrownIcon,
  DumbbellIcon,
  LockIcon,
  StarIcon,
  SwordsIcon,
  ZapIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { t } from '../strings';
import {
  BATTLE_NODE_GEOMETRY,
  currentUnit,
  gameState,
  nextUnitAfter,
  unitCompleted,
  unitStars,
  units } from
'../gameData';
import type { GameLevel, GameUnit, LevelKind } from '../gameData';
import { NodeMotionRing } from '../motion/NodeMotionRing';
import { nodeVisualStyle } from '../motion/nodeMotionPath';
import { CelebrationOverlay } from '../celebration/CelebrationOverlay';

const GOLD = 'hsl(42 96% 50%)';
const CYAN = 'hsl(199 89% 62%)';

const KIND_ICONS: Record<LevelKind, LucideIcon> = {
  practice: DumbbellIcon,
  speed: ZapIcon,
  boss: CrownIcon
};

/* path geometry — the circle centre of every node sits exactly at (cx, cy),
   so the SVG connectors meet the circle edges precisely. */
const COL_W = 280;
const OFFSETS = [0, 56, 30, -38, -58];

interface NodeGeom {
  top: number;
  h: number;
  nodeTop: number;
  cx: number;
  cy: number;
  size: number;
}

function computeGeometry(levels: GameLevel[], currentId: number): NodeGeom[] {
  const rows: NodeGeom[] = [];
  let y = 0;
  const all = [...levels.map((l) => l.id), -1]; // -1 = battle node
  all.forEach((id, i) => {
    const isCurrent = id === currentId;
    const isBattle = id === -1;
    /* row height fully contains circle + label (+ stars / two-line sub) */
    const h = isBattle ? 152 : isCurrent ? 156 : 110;
    const size = isBattle ? 60 : isCurrent ? 66 : 56;
    /* current row reserves space above the circle for the floating START pill */
    const nodeTop = isCurrent ? 48 : 8;
    rows.push({
      top: y,
      h,
      size,
      nodeTop,
      cx: COL_W / 2 + OFFSETS[i % OFFSETS.length],
      cy: y + nodeTop + size / 2
    });
    y += h;
  });
  return rows;
}

interface TopicJourneyProps {
  locked: boolean;
  justUnlockedId: number | null;
  /** node id to salute with the party popper — set only on confirmed progression */
  celebrateUnlockId: number | null;
  onCelebrationDone: () => void;
  onOpenLevel: (level: GameLevel) => void;
  onOpenBattle: () => void;
  onAllTopics: () => void;
}

export function TopicJourney({
  locked,
  justUnlockedId,
  celebrateUnlockId,
  onCelebrationDone,
  onOpenLevel,
  onOpenBattle,
  onAllTopics
}: TopicJourneyProps) {
  const unit = currentUnit();
  const unitIndex = units.findIndex((u) => u.id === unit.id);
  const done = unit.levels.filter((l) => l.id < gameState.currentId).length;
  const stars = unitStars(unit);
  const mastery = Math.round(stars / (unit.levels.length * 3) * 100);
  const topicDone = unitCompleted(unit);
  const next = nextUnitAfter(unit);
  const geom = computeGeometry(unit.levels, locked ? -99 : gameState.currentId);
  const totalH = geom.reduce((s, g) => s + g.h, 0);

  const mapRef = useRef<HTMLDivElement>(null);
  const [celebration, setCelebration] = useState<{
    id: number;
    x: number;
    y: number;
    size: number;
  } | null>(null);

  /* Anchor the popper to the freshly unlocked node. Measured synchronously
     in the effect — the commit that armed the celebration also laid out the
     new current node, so rect and geom are already coherent (a rAF hop here
     would silently never fire in hidden/backgrounded pages). Bails out when
     the map isn't visible (e.g. the round was finished from the curriculum
     list) — no celebration without a stage. */
  useEffect(() => {
    if (celebrateUnlockId === null) return;
    const host = mapRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const idx = unit.levels.findIndex((l) => l.id === celebrateUnlockId);
    const g = idx >= 0 ? geom[idx] : topicDone ? geom[geom.length - 1] : null;
    if (!g) return;
    setCelebration({
      id: celebrateUnlockId,
      x: rect.left + g.cx,
      y: rect.top + g.cy,
      size: g.size
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrateUnlockId]);

  /* connector segment state between node i and i+1 */
  function segmentState(i: number): 'done' | 'active' | 'future' | 'far' {
    const toBattle = i + 1 === unit.levels.length;
    if (toBattle) return topicDone && !locked ? 'active' : 'far';
    const to = unit.levels[i + 1];
    if (to.id < gameState.currentId) return 'done';
    if (to.id === gameState.currentId && !locked) return 'active';
    return to.id === gameState.currentId + 1 ? 'future' : 'far';
  }

  return (
    <>
      {/* ── Topic hero — typography first, no pills ── */}
      <section className="slide-up-fade px-4">
        <div
          key={unit.id}
          className="rise-in relative overflow-hidden rounded-[20px] p-5"
          style={{
            background: 'linear-gradient(155deg, hsl(228 45% 13%), hsl(232 48% 8%))',
            boxShadow: '0 12px 34px hsl(228 45% 8% / 0.35)'
          }}>

          <span
            className="pointer-events-none absolute -right-10 -top-14 h-[170px] w-[170px] rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(224 94% 60% / 0.24), transparent 70%)' }} />

          <TopicArt kind={unit.icon} />

          <div className="relative max-w-[200px]">
            <p className="font-sans text-caption font-bold tracking-[1.4px]" style={{ color: CYAN }}>
              {t.topicCaption(unitIndex + 1)}
            </p>
            <h2 className="mt-1 font-display text-largetitle font-bold text-white">
              {unit.title}
            </h2>
            <p className="mt-2 font-sans text-subhead text-white/60">
              {t.topicGamesOf(done, unit.levels.length)} · {t.topicMastery(mastery)}
            </p>
            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.09]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${done / unit.levels.length * 100}%`,
                  background: `linear-gradient(90deg, hsl(224 94% 58%), ${CYAN})`,
                  boxShadow: '0 0 10px hsl(210 92% 56% / 0.7)'
                }} />

            </div>
          </div>
        </div>
      </section>

      {/* ── Connected path ── */}
      <section className="px-4">
        <div ref={mapRef} className="relative mx-auto" style={{ width: COL_W, height: totalH }}>
          <svg
            className="fade-in pointer-events-none absolute inset-0"
            width={COL_W}
            height={totalH}
            aria-hidden="true"
            style={{ animationDelay: '150ms' }}>

            {geom.slice(0, -1).map((g, i) => {
              const to = geom[i + 1];
              const state = segmentState(i);
              const startY = g.cy + g.size / 2 + 4;
              const endY = to.cy - to.size / 2 - 6;
              const bend = (endY - startY) * 0.5;
              const d = `M ${g.cx} ${startY} C ${g.cx} ${startY + bend}, ${to.cx} ${endY - bend}, ${to.cx} ${endY}`;
              const color =
              state === 'done' || state === 'active' ?
              'hsl(var(--primary))' :
              'hsl(var(--muted-fg))';
              return (
                <g key={i}>
                  {(state === 'done' || state === 'active') &&
                  <path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.14} />
                  }
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={state === 'far' ? 2 : 3}
                    strokeLinecap="round"
                    strokeDasharray={state === 'active' ? '3 8' : state === 'done' ? undefined : '2 9'}
                    className={state === 'active' ? 'path-flow' : ''}
                    opacity={
                    state === 'done' ? 0.7 : state === 'active' ? 0.95 : state === 'future' ? 0.3 : 0.14
                    } />

                </g>);

            })}
          </svg>

          {unit.levels.map((level, i) =>
          <PathNode
            key={level.id}
            level={level}
            geom={geom[i]}
            order={i}
            locked={locked}
            justUnlocked={justUnlockedId === level.id}
            celebrationArmed={celebrateUnlockId === level.id}
            onOpen={() => onOpenLevel(level)} />

          )}
          <BattleNode
            geom={geom[geom.length - 1]}
            order={geom.length - 1}
            available={topicDone && !locked}
            onOpen={onOpenBattle} />

          {celebration &&
          <CelebrationOverlay
            key={celebration.id}
            x={celebration.x}
            y={celebration.y}
            nodeSize={celebration.size}
            onDone={() => {
              setCelebration(null);
              onCelebrationDone();
            }} />
          }
        </div>

        <button
          type="button"
          onClick={onAllTopics}
          className="mx-auto mt-5 flex h-[44px] items-center gap-1 px-4 font-sans text-subhead font-semibold text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-70">

          {t.allTopicsLink}
          <ChevronRightIcon size={16} />
        </button>
      </section>

      {/* ── Next topic — quiet, curiosity-driven ── */}
      {next &&
      <section className="slide-up-fade px-4" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-4 py-2 opacity-[0.85]">
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-muted/70">
              <LockIcon size={17} className="text-mutedfg" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-caption font-bold tracking-[1.2px] text-mutedfg">
                {t.nextTopicCaption}
              </p>
              <h3 className="mt-[1px] truncate font-display text-title3 font-bold text-foreground/60">
                {next.title}
              </h3>
              <p className="mt-[1px] font-sans text-footnote text-mutedfg">{t.nextTopicLock}</p>
            </div>
          </div>
        </section>
      }
    </>);

}

/* ── topic-specific illustration (original math visuals) ── */

function TopicArt({ kind }: {kind: GameUnit['icon'];}) {
  if (kind === 'pie') {
    // Kasrlar — segmented fraction circle
    return (
      <svg className="pointer-events-none absolute right-4 top-5 h-[104px] w-[104px]" viewBox="0 0 104 104" aria-hidden="true">
        <g className="float-y">
          <circle cx="52" cy="52" r="34" fill="none" stroke="hsl(224 94% 64% / 0.5)" strokeWidth="2" />
          <path d="M52 52 L52 18 A34 34 0 0 1 84.4 62.5 Z" fill="hsl(199 89% 55% / 0.35)" stroke={CYAN} strokeWidth="2" />
          <line x1="52" y1="52" x2="52" y2="18" stroke={CYAN} strokeWidth="2" />
          <line x1="52" y1="52" x2="84.4" y2="62.5" stroke={CYAN} strokeWidth="2" />
        </g>
        <text x="14" y="30" fontSize="15" fontWeight="700" fill="hsl(262 88% 72% / 0.9)" className="float-y" style={{ animationDelay: '500ms' }}>½</text>
        <text x="80" y="96" fontSize="13" fontWeight="700" fill="hsl(224 94% 70% / 0.8)" className="float-y" style={{ animationDelay: '900ms' }}>¾</text>
      </svg>);

  }
  if (kind === 'calculator') {
    // O'nli kasrlar — digits and a glowing decimal point
    return (
      <svg className="pointer-events-none absolute right-4 top-6 h-[96px] w-[110px]" viewBox="0 0 110 96" aria-hidden="true">
        <text x="4" y="58" fontSize="40" fontWeight="700" fill="hsl(224 94% 70% / 0.85)" className="float-y">0</text>
        <circle cx="46" cy="54" r="5" fill={CYAN} className="float-y" style={{ animationDelay: '400ms' }} />
        <text x="58" y="58" fontSize="40" fontWeight="700" fill="hsl(262 88% 72% / 0.85)" className="float-y" style={{ animationDelay: '700ms' }}>5</text>
        <line x1="10" y1="76" x2="96" y2="76" stroke="hsl(224 94% 64% / 0.4)" strokeWidth="2" strokeDasharray="4 6" />
      </svg>);

  }
  if (kind === 'percent') {
    return (
      <svg className="pointer-events-none absolute right-4 top-6 h-[96px] w-[100px]" viewBox="0 0 100 96" aria-hidden="true">
        <circle cx="28" cy="26" r="13" fill="none" stroke={CYAN} strokeWidth="2.5" className="float-y" />
        <circle cx="72" cy="70" r="13" fill="none" stroke="hsl(262 88% 68% / 0.8)" strokeWidth="2.5" className="float-y" style={{ animationDelay: '600ms' }} />
        <line x1="82" y1="14" x2="18" y2="82" stroke="hsl(224 94% 64% / 0.8)" strokeWidth="3" strokeLinecap="round" />
      </svg>);

  }
  if (kind === 'scale') {
    return (
      <svg className="pointer-events-none absolute right-4 top-6 h-[96px] w-[110px]" viewBox="0 0 110 96" aria-hidden="true">
        <g className="float-y">
          <line x1="55" y1="16" x2="55" y2="70" stroke="hsl(224 94% 64% / 0.7)" strokeWidth="2.5" />
          <line x1="18" y1="26" x2="92" y2="26" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8 46 A11 11 0 0 0 30 46 Z" fill="hsl(199 89% 55% / 0.3)" stroke={CYAN} strokeWidth="2" />
          <path d="M80 46 A11 11 0 0 0 102 46 Z" fill="hsl(262 88% 62% / 0.3)" stroke="hsl(262 88% 68%)" strokeWidth="2" />
          <line x1="19" y1="26" x2="19" y2="44" stroke={CYAN} strokeWidth="1.8" />
          <line x1="91" y1="26" x2="91" y2="44" stroke="hsl(262 88% 68%)" strokeWidth="1.8" />
        </g>
      </svg>);

  }
  // hash — Butun sonlar: floating integers
  return (
    <svg className="pointer-events-none absolute right-4 top-5 h-[100px] w-[104px]" viewBox="0 0 104 100" aria-hidden="true">
      <text x="6" y="42" fontSize="34" fontWeight="700" fill="hsl(224 94% 70% / 0.85)" className="float-y">7</text>
      <text x="44" y="76" fontSize="26" fontWeight="700" fill={CYAN} className="float-y" style={{ animationDelay: '450ms' }}>−3</text>
      <text x="66" y="34" fontSize="22" fontWeight="700" fill="hsl(262 88% 72% / 0.85)" className="float-y" style={{ animationDelay: '850ms' }}>12</text>
    </svg>);

}

/* ── nodes ─────────────────────────────────────────────── */

function PathNode({
  level,
  geom,
  order,
  locked,
  justUnlocked,
  celebrationArmed,
  onOpen






}: {level: GameLevel;geom: NodeGeom;order: number;locked: boolean;justUnlocked: boolean;celebrationArmed: boolean;onOpen: () => void;}) {
  const done = level.id < gameState.currentId;
  const current = level.id === gameState.currentId && !locked;
  const stars = gameState.stars[level.id] ?? 0;
  const boss = level.kind === 'boss';
  const Icon = done ? CheckIcon : KIND_ICONS[level.kind];
  const { size } = geom;

  /* node shape personality lives on the level's own geometry — one source
     of truth shared by the styling below and the motion path engine */
  const visual = nodeVisualStyle(level.geometry);
  const radius = visual.borderRadius;
  const counterRotate = `rotate(${-visual.rotationDeg}deg)`;

  return (
    <div
      className="absolute"
      style={{
        left: geom.cx,
        top: geom.top + geom.nodeTop,
        transform: 'translateX(-50%)'
      }}>

      <button
        type="button"
        onClick={onOpen}
        aria-label={level.title}
        className="slide-up-fade relative flex flex-col items-center transition-transform duration-150 ease-out active:scale-[0.92]"
        style={{ animationDelay: `${120 + order * 70}ms` }}>

        {current &&
        <span
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
          style={{ bottom: 'calc(100% + 8px)' }}>

            <span className="float-y flex whitespace-nowrap rounded-full border border-primary/40 bg-card px-3 py-[5px] font-sans text-caption font-bold tracking-[0.6px] text-primary shadow-thumb">
              {t.startLesson}
            </span>
          </span>
        }
        {current &&
        <>
            <span
            className="halo absolute left-1/2 bg-primary"
            style={{
              width: size,
              height: size,
              top: 0,
              marginLeft: -size / 2,
              borderRadius: radius,
              ['--halo-rot' as never]: `${visual.rotationDeg}deg`
            }} />

            <NodeMotionRing geometry={level.geometry} size={size} />
          </>
        }
        <span
          className={['relative flex items-center justify-center', justUnlocked ? 'unlock-in' : ''].join(' ')}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            ['--node-rot' as never]: `${visual.rotationDeg}deg`,
            transform: 'rotate(var(--node-rot))',
            /* with a popper armed, the reveal lands just after the bang */
            animationDelay: justUnlocked && celebrationArmed ? '560ms' : undefined,
            background:
            done || current ?
            'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary) / 0.75))' :
            'hsl(var(--muted))',
            boxShadow: current ?
            '0 0 24px hsl(var(--primary) / 0.5), 0 6px 16px hsl(var(--primary) / 0.35)' :
            done ?
            '0 4px 12px hsl(var(--primary) / 0.22)' :
            'none',
            opacity: !done && !current ? 0.6 : 1
          }}>

          <span style={{ transform: counterRotate }}>
            <Icon
              size={boss && !done ? 27 : 23}
              strokeWidth={2.4}
              className={done || current ? 'text-primaryfg' : 'text-mutedfg'} />

          </span>
          {!done && !current &&
          <span
            className="absolute -bottom-[3px] -right-[3px] flex h-[19px] w-[19px] items-center justify-center rounded-full border border-cardborder bg-card"
            style={{ transform: counterRotate }}>

              <LockIcon size={10} className="text-mutedfg" />
            </span>
          }
        </span>
        <span
          className={[
          'mt-[7px] rounded-full bg-background/95 px-2 font-sans text-caption font-semibold',
          current ? 'text-primary' : done ? 'text-foreground/75' : 'text-mutedfg/60'].
          join(' ')}>

          {level.title}
        </span>
        <span className="flex h-[13px] items-end gap-[2px]">
          {done &&
          [0, 1, 2].map((i) =>
          <StarIcon
            key={i}
            size={i === 1 ? 12 : 9}
            style={{
              color: i < stars ? GOLD : 'hsl(var(--muted))',
              fill: i < stars ? GOLD : 'hsl(var(--muted))'
            }} />

          )}
        </span>
      </button>
    </div>);

}

function BattleNode({
  geom,
  order,
  available,
  onOpen




}: {geom: NodeGeom;order: number;available: boolean;onOpen: () => void;}) {
  const { size } = geom;
  return (
    <div
      className="absolute"
      style={{
        left: geom.cx,
        top: geom.top + geom.nodeTop,
        transform: 'translateX(-50%)'
      }}>

      <button
        type="button"
        onClick={onOpen}
        aria-label={t.pathBattleTitle}
        className="slide-up-fade relative flex flex-col items-center transition-transform duration-150 ease-out active:scale-[0.92]"
        style={{ animationDelay: `${120 + order * 70}ms` }}>

        {available && <NodeMotionRing geometry={BATTLE_NODE_GEOMETRY} size={size} />}
        <span
          className="relative flex items-center justify-center"
          style={{
            width: size,
            height: size,
            borderRadius: '30%',
            background: available ?
            'linear-gradient(180deg, hsl(var(--accent)), hsl(262 88% 52%))' :
            'hsl(var(--muted))',
            boxShadow: available ? '0 0 22px hsl(262 88% 62% / 0.45)' : 'none',
            opacity: available ? 1 : 0.6
          }}>

          <SwordsIcon size={25} strokeWidth={2.2} className={available ? 'text-white' : 'text-mutedfg'} />
          {!available &&
          <span className="absolute -bottom-[3px] -right-[3px] flex h-[19px] w-[19px] items-center justify-center rounded-full border border-cardborder bg-card">
              <LockIcon size={10} className="text-mutedfg" />
            </span>
          }
        </span>
        <span
          className={[
          'mt-[7px] rounded-full bg-background/95 px-2 font-sans text-caption font-bold',
          available ? 'text-accent' : 'text-mutedfg/60'].
          join(' ')}>

          {t.pathBattleTitle}
        </span>
        <span className="mt-[2px] max-w-[150px] rounded-md bg-background/95 px-1 text-center font-sans text-[10px] leading-tight text-mutedfg">
          {available ? t.pathBattleSub : t.pathBattleLocked}
        </span>
      </button>
    </div>);

}
