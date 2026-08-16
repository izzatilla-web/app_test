import { useState } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, LockIcon, PlayIcon } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { EmptyState } from './EmptyState';
import { VideoSheet } from './VideoSheet';
import { t } from '../strings';
import { formatDuration, haptic, ASSETS_3D } from '../tokens';
import { sound } from '../sound';
import {
  blockingTopics,
  canOpenTopic,
  currentPosition,
  levelAccess,
  levelProgress,
  moduleAccess,
  moduleExam,
  moduleProgress,
  topicAccess
} from '../access';
import type { ItemState } from '../access';
import { curriculumFor, topicNumber } from '../curriculum';
import type { CurriculumLevel, CurriculumModule, CurriculumTopic } from '../curriculum';
import { examPill, homeworkPill } from '../utils/status';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { LevelDetail } from '../screens/LevelDetail';

/**
 * The learning curriculum: LEVEL → MODULE → TOPIC → work.
 * Clean, structured, intentional EdTech hierarchy.
 */
export function CurriculumBrowser({ child }: { child: ChildRecord }) {
  const ui = useUI();
  const levels = curriculumFor(child.id);
  const position = currentPosition(levels);

  if (levels.length === 0) {
    return <EmptyState icon={LockIcon} title={t.lsEmptyTitle} body={t.lsEmptyBody} />;
  }

  function openDetail(level: CurriculumLevel) {
    haptic('light');
    ui.push({
      key: `level-${level.id}`,
      backTitle: t.tabLessons,
      node: <LevelDetail child={child} levelId={level.id} />
    });
  }

  return (
    <div className="space-y-4 px-4 pb-20">
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
              onOpen={() => openDetail(level)}
            />
          );
        }
        // Current level — hero card + its modules inline
        return (
          <div key={level.id} className="space-y-3">
            <LevelHeroCard
              level={level}
              state={state}
              asset3D={ASSETS_3D.numbers248}
            />
            {level.modules.map((module) => (
              <ModuleCard
                key={module.id}
                child={child}
                levels={levels}
                module={module}
                currentTopicId={position?.topic.id ?? null}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ── Level hero card ───────────────────────────────────── */

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

  // Light, friendly, student-appropriate gradients matching reference
  const gradientBg = completed
    ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)'
    : 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #2563EB 100%)';

  const inner = (
    <div className="relative flex items-center justify-between gap-4 overflow-hidden p-5">
      {/* Left content with intentional hierarchy */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            {level.code}
          </span>
          {completed ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-sans text-xs font-semibold text-emerald-200 backdrop-blur-md">
              <CheckIcon size={12} strokeWidth={3} />
              {t.lsDoneBadge}
            </span>
          ) : (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-sans text-xs font-semibold text-white backdrop-blur-md">
              {t.lsStateCurrent}
            </span>
          )}
          {completed && (
            <ChevronRightIcon size={18} className="ml-auto text-white/70" />
          )}
        </div>

        <span className="mt-2 block truncate font-sans text-base font-semibold text-white/95">
          {level.title}
        </span>

        {/* Progress bar */}
        <div className="mt-4 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="bar-fill h-full rounded-full bg-white"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-sans text-xs font-medium tabular-nums text-white/85">
            <span>
              {progress.done} / {progress.total} mavzu · {progress.percent}%
            </span>
          </div>
        </div>
      </div>

      {/* Right 3D Visual Asset — transparent PNG, no background box */}
      {asset3D && (
        <div className="relative z-10 -my-1 -mr-1 flex h-24 w-24 shrink-0 items-center justify-center">
          <img
            src={asset3D}
            alt={level.title}
            className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] transition-transform duration-200 group-hover:scale-105"
            loading="eager"
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
        className="group relative block w-full overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-150 ease-out active:scale-[0.99] active:opacity-95"
        style={{ background: gradientBg }}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-sm"
      style={{ background: gradientBg }}
    >
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

/* ── Module Card ────────────────────────────────────────────── */

function ModuleCard({
  child,
  levels,
  module,
  currentTopicId
}: {
  child: ChildRecord;
  levels: CurriculumLevel[];
  module: CurriculumModule;
  currentTopicId: number | null;
}) {
  const state = moduleAccess(levels, module);
  const progress = moduleProgress(module);
  const exam = moduleExam(module, child);
  const locked = state === 'locked';
  const remaining = blockingTopics(module).length;
  const passed = exam !== null && exam.result === 'pass';
  const [open, setOpen] = useState(state === 'current');

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border bg-card transition-all duration-150 ease-out shadow-sm',
        state === 'current'
          ? 'border-blue-500/40 ring-1 ring-blue-500/20 dark:border-blue-400/40'
          : 'border-cardborder',
        locked ? 'opacity-55' : ''
      ].join(' ')}
    >
      {passed && <PassedCorner />}

      <button
        type="button"
        onClick={
          locked
            ? undefined
            : () => {
                haptic('light');
                setOpen((value) => !value);
              }
        }
        aria-expanded={open}
        aria-label={t.lsExpandModule}
        disabled={locked}
        className={[
          'flex w-full items-start gap-3 p-4 text-left',
          locked ? '' : 'transition-opacity duration-100 ease-out active:opacity-75'
        ].join(' ')}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-blue-600 dark:text-blue-400">
              {module.code}
            </span>
            <StateMark state={state} />
          </span>
          <span className="mt-1 block truncate font-sans text-base font-semibold text-foreground">
            {module.title}
          </span>
          <span className="mt-2.5 block">
            <ProgressLine percent={progress.percent} strong={state === 'current'} thin />
          </span>
          <span className="mt-2 block font-sans text-xs font-medium tabular-nums text-mutedfg">
            {t.lsTopicsShort(progress.done, progress.total)}
          </span>
          {locked && remaining > 0 && (
            <span className="mt-1 block font-sans text-xs text-mutedfg">
              {t.lsLockedHint(remaining)}
            </span>
          )}
        </span>
        {!locked && (
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
            <ChevronDownIcon
              size={16}
              strokeWidth={2.2}
              className="transition-transform duration-200 ease-out"
              style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </div>
        )}
      </button>

      {exam && !locked && <ExamResult score={exam.score} result={exam.result} />}

      {open && !locked && (
        <ul className="accordion-in divide-y divide-hairline border-t border-hairline bg-slate-50/50 dark:bg-slate-900/50">
          {module.topics.map((topic) => (
            <TopicRow
              key={topic.id}
              levels={levels}
              module={module}
              topic={topic}
              current={topic.id === currentTopicId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function PassedCorner() {
  return (
    <span className="pointer-events-none absolute right-0 top-0 z-10" aria-hidden="true">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <path d="M0 0 L36 0 L36 36 Z" fill="hsl(var(--good) / 0.15)" />
        <path d="M0 0 L36 36" stroke="hsl(var(--good) / 0.3)" strokeWidth="1" />
      </svg>
      <CheckIcon
        size={11}
        strokeWidth={3.5}
        className="absolute right-[5px] top-[5px] text-good"
      />
    </span>
  );
}

export function ExamResult({ score, result }: { score: number; result: 'pass' | 'conditional' | 'fail' }) {
  const pill = examPill(result);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3">
      <div>
        <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-mutedfg">
          {t.lsExamResult}
        </p>
        <p className="mt-0.5 font-display text-lg font-bold tabular-nums leading-none text-foreground">
          {score}
          <span className="ml-1 font-sans text-xs font-normal text-mutedfg">/ 100</span>
        </p>
        <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="bar-fill h-full rounded-full"
            style={{
              width: `${score}%`,
              backgroundColor:
                result === 'pass'
                  ? 'hsl(var(--good))'
                  : result === 'conditional'
                  ? 'hsl(var(--warn))'
                  : 'hsl(var(--bad))'
            }}
          />
        </div>
      </div>
      <StatusPill tone={pill.tone} label={pill.label} />
    </div>
  );
}

/* ── Topic Row ─────────────────────────────────────────────── */

export function TopicRow({
  levels,
  module,
  topic,
  current
}: {
  levels: CurriculumLevel[];
  module: CurriculumModule;
  topic: CurriculumTopic;
  current: boolean;
}) {
  const ui = useUI();
  const state = topicAccess(levels, topic);
  const open = canOpenTopic(levels, topic.id);
  const [expanded, setExpanded] = useState(current);

  return (
    <li
      className={[
        'transition-colors duration-150',
        current ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'bg-transparent'
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => {
          if (!open) {
            haptic('warning');
            ui.toast(t.lsLockedToast, 'warning');
            return;
          }
          haptic('light');
          setExpanded((value) => !value);
        }}
        className={[
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          open ? 'transition-opacity duration-100 ease-out active:opacity-75' : 'opacity-45'
        ].join(' ')}
      >
        <TopicMark state={state} number={topicNumber(module, topic)} />
        <div className="min-w-0 flex-1">
          <span
            className={[
              'block truncate font-sans text-sm text-foreground',
              current ? 'font-bold text-blue-900 dark:text-blue-100' : 'font-medium'
            ].join(' ')}
          >
            {topic.title}
          </span>
          {current && (
            <span className="mt-0.5 block font-sans text-xs font-semibold text-blue-600 dark:text-blue-400">
              {t.lsContinueHere}
            </span>
          )}
        </div>
        {open && (
          <ChevronDownIcon
            size={16}
            className="shrink-0 text-slate-400 transition-transform duration-200 ease-out"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
        )}
      </button>

      {open && expanded && <TopicWork topic={topic} module={module} />}
    </li>
  );
}

function TopicWork({ topic, module }: { topic: CurriculumTopic; module: CurriculumModule }) {
  const ui = useUI();
  const { content } = topic;
  const homework = homeworkPill(content.homework);
  const practiceLocked =
    !topic.studied && content.videos.some((video) => !video.watched);

  let step = 0;
  const nextStep = () => String(++step);

  return (
    <div className="accordion-in px-4 pb-3.5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        {content.videos.map((video, i) => (
          <button
            key={video.title + i}
            type="button"
            onClick={() => {
              haptic('light');
              sound.select();
              ui.openSheet({
                key: `video-${topic.id}-${i}`,
                detent: 'medium',
                node: <VideoSheet video={video} topicTitle={topic.title} />
              });
            }}
            className="flex w-full items-center gap-3 border-b border-hairline p-3 text-left transition-colors duration-100 ease-out active:bg-slate-50 dark:active:bg-slate-800"
          >
            <StepNumber value={nextStep()} />
            <VideoTile number={topicNumber(module, topic)} watched={video.watched} />
            <div className="min-w-0 flex-1">
              <span className="block truncate font-sans text-xs font-bold text-foreground">
                {content.videos.length > 1 ? video.title : "Ko'rish"}
              </span>
              <span className="mt-0.5 block truncate font-sans text-[11px] text-mutedfg">
                {formatDuration(video.seconds)} · Dars matni
              </span>
              <span className="mt-1 flex items-center gap-1 font-sans text-xs font-bold text-blue-600 dark:text-blue-400">
                <PlayIcon size={10} className="fill-current" />
                {video.watched ? t.lsRewatch : "Videoni ko'rish"}
              </span>
            </div>
            {video.watched && <DoneTick />}
            <ChevronRightIcon size={16} className="shrink-0 text-mutedfg" />
          </button>
        ))}

        {content.practice && (
          <StepRow
            number={nextStep()}
            label={t.lsStepPractice}
            hint="Amaliy mashqlar"
            dimmed={practiceLocked}
            trailing={
              practiceLocked ? (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-sans text-xs text-mutedfg dark:bg-slate-800">
                  <LockIcon size={11} />
                  {t.lsPracticeLocked}
                </span>
              ) : (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-sans text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  {t.lsAvailable}
                </span>
              )
            }
          />
        )}

        <StepRow
          number={nextStep()}
          label={t.lessonHomework}
          last
          trailing={
            homework ? (
              <StatusPill tone={homework.tone} label={homework.label} />
            ) : (
              <span className="font-sans text-xs text-mutedfg">{t.lsHomeworkNone}</span>
            )
          }
        />
      </div>
    </div>
  );
}

function StepRow({
  number,
  label,
  hint,
  trailing,
  last,
  dimmed
}: {
  number: string;
  label: string;
  hint?: string;
  trailing: React.ReactNode;
  last?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 p-3',
        last ? '' : 'border-b border-hairline',
        dimmed ? 'opacity-60' : ''
      ].join(' ')}
    >
      <StepNumber value={number} />
      <div className="min-w-0 flex-1">
        <span className="block font-sans text-xs font-bold text-foreground">{label}</span>
        {hint && (
          <span className="mt-0.5 block truncate font-sans text-[11px] text-mutedfg">{hint}</span>
        )}
      </div>
      {trailing}
    </div>
  );
}

function StepNumber({ value }: { value: string }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 font-sans text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      {value}
    </span>
  );
}

function DoneTick() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
      <CheckIcon size={12} strokeWidth={3.5} />
    </span>
  );
}

function VideoTile({ number, watched }: { number: string; watched: boolean }) {
  return (
    <span
      className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm"
      style={{
        background:
          'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)'
      }}
    >
      <span className="font-display text-base font-bold tabular-nums text-white/40">
        {number}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
          <PlayIcon size={11} strokeWidth={3} className="ml-0.5 fill-current" />
        </span>
      </span>
      {watched && (
        <span className="absolute bottom-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-1 ring-white">
          <CheckIcon size={7} strokeWidth={3.5} className="text-white" />
        </span>
      )}
    </span>
  );
}

/* ── State marks ───────────────────────────────────────── */

function StateMark({ state }: { state: ItemState }) {
  if (state === 'completed') {
    return (
      <span
        role="img"
        aria-label={t.lsStateCompleted}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
      >
        <CheckIcon size={11} strokeWidth={3.5} />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        {t.lsStateCurrent}
      </span>
    );
  }
  if (state === 'locked') {
    return <LockIcon size={13} aria-label={t.lsStateLocked} className="text-mutedfg" />;
  }
  return null;
}

function TopicMark({ state, number }: { state: ItemState; number: string }) {
  if (state === 'completed') {
    return (
      <span
        role="img"
        aria-label={t.lsStateCompleted}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
      >
        <CheckIcon size={13} strokeWidth={3.2} />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 font-sans text-xs font-bold text-white shadow-sm ring-2 ring-blue-100 dark:ring-blue-900">
        {number}
      </span>
    );
  }
  if (state === 'locked') {
    return (
      <span
        role="img"
        aria-label={t.lsStateLocked}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800"
      >
        <LockIcon size={13} />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-sans text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      {number}
    </span>
  );
}

function ProgressLine({
  percent,
  strong,
  thin
}: {
  percent: number;
  strong?: boolean;
  thin?: boolean;
}) {
  return (
    <div
      className={[
        'block w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800',
        thin ? 'h-1' : 'h-1.5'
      ].join(' ')}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
        style={{
          width: `${percent}%`,
          boxShadow: strong && percent > 0 ? '0 0 6px rgba(37,99,235,0.4)' : undefined
        }}
      />
    </div>
  );
}
