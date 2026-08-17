import {
  PlayIcon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon
} from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { VideoSheet } from '../components/VideoSheet';
import { t } from '../strings';
import { formatDuration, haptic } from '../tokens';
import { topicAccess } from '../access';
import type { CurriculumLevel, CurriculumModule, CurriculumTopic } from '../curriculum';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';

interface ModuleDetailProps {
  child: ChildRecord;
  levels: CurriculumLevel[];
  level: CurriculumLevel;
  module: CurriculumModule;
}

/**
 * Minimalist, ultra-clean Module & Lessons Screen:
 * - Top 16:9 Video Banner / Player
 * - Clean Module Title & Lesson count / Duration
 * - Direct 1x1 Lesson Cards (01, 02, 03)
 * - Bottom CTA Button
 */
export function ModuleDetail({ levels, level, module }: ModuleDetailProps) {
  const ui = useUI();

  // Find active or first topic
  const activeTopic =
    module.topics.find((t) => topicAccess(levels, t) === 'current') ||
    module.topics[0];

  const totalSeconds = module.topics.reduce((acc, t) => {
    return acc + t.content.videos.reduce((vAcc, v) => vAcc + v.seconds, 0);
  }, 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

  function openVideo(topic: CurriculumTopic) {
    const video = topic.content.videos[0];
    if (!video) return;
    haptic('light');
    ui.openSheet({
      key: `video-${topic.id}`,
      detent: 'medium',
      node: <VideoSheet video={video} topicTitle={topic.title} />
    });
  }

  return (
    <PushScreen
      title={module.title}
      backTitle={t.tabLessons}
      onBack={ui.pop}
    >
      <div className="space-y-5 px-4 pb-24">
        {/* 1. Top Video Hero Banner */}
        <div className="pt-1">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm text-white flex flex-col items-center justify-center p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (activeTopic) openVideo(activeTopic);
              }}
              className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md shadow-lg transition-transform active:scale-95 hover:bg-white/35"
              aria-label="Videoni boshlash"
            >
              <PlayIcon size={24} className="ml-1 fill-current" />
            </button>

            <p className="relative z-10 mt-3 font-sans text-xs font-semibold text-blue-100">
              {activeTopic ? activeTopic.title : module.title}
            </p>
          </div>
        </div>

        {/* 2. Clean Title & Meta */}
        <div>
          <span className="font-sans text-xs font-bold text-blue-600 dark:text-blue-400">
            {module.code} Modul · {level.title}
          </span>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-foreground">
            {module.title}
          </h1>
          <div className="mt-2 flex items-center gap-3 font-sans text-xs text-mutedfg">
            <span>{module.topics.length} ta dars</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ClockIcon size={12} />
              {durationStr}
            </span>
          </div>
        </div>

        {/* 3. Direct 1x1 Lesson List matching reference */}
        <div className="space-y-2.5">
          <h2 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Darslar
          </h2>

          <div className="space-y-2.5">
            {module.topics.map((topic, index) => {
              const state = topicAccess(levels, topic);
              const locked = state === 'locked';
              const completed = state === 'completed';
              const current = state === 'current';
              const video = topic.content.videos[0];
              const numStr = String(index + 1).padStart(2, '0');

              return (
                <button
                  key={topic.id}
                  type="button"
                  disabled={locked}
                  onClick={() => openVideo(topic)}
                  className={[
                    'flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99]',
                    current
                      ? 'border-blue-500/50 bg-blue-50/40 shadow-sm dark:bg-blue-950/20 dark:border-blue-400/40 ring-1 ring-blue-500/20'
                      : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
                    locked ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-700'
                  ].join(' ')}
                >
                  {/* Big clean number (01, 02, 03) */}
                  <span
                    className={[
                      'font-display text-2xl font-bold tracking-tight shrink-0 w-8 text-center',
                      current
                        ? 'text-blue-600 dark:text-blue-400'
                        : completed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-300 dark:text-slate-600'
                    ].join(' ')}
                  >
                    {numStr}
                  </span>

                  {/* Title & Duration */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        'font-sans text-sm font-semibold truncate',
                        current ? 'text-blue-900 dark:text-blue-100 font-bold' : 'text-foreground'
                      ].join(' ')}
                    >
                      {topic.title}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-mutedfg">
                      {video ? formatDuration(video.seconds) : '15 min'} · {completed ? "O'zlashtirildi" : current ? "Joriy dars" : "Mavzu"}
                    </p>
                  </div>

                  {/* Circular action button on the right */}
                  <div className="shrink-0">
                    {completed ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckCircle2Icon size={18} strokeWidth={2.4} />
                      </div>
                    ) : locked ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <LockIcon size={16} />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform active:scale-90">
                        <PlayIcon size={14} className="ml-0.5 fill-current" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Bottom Continue CTA */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (activeTopic) openVideo(activeTopic);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-sans text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-blue-700"
          >
            <PlayIcon size={16} className="fill-current" />
            Darsni davom ettirish
          </button>
        </div>
      </div>
    </PushScreen>
  );
}
