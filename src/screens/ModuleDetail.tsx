import React, { useState } from 'react';
import {
  ChevronRightIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { TopicMaterialHubSheet } from '../components/TopicMaterialHubSheet';
import { t } from '../strings';
import { formatDuration, haptic } from '../tokens';
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
 * Minimalist, Apple-style Module & Lessons Screen:
 * - Direct ordered lesson list (01, 02, 03)
 * - Per-lesson progress bar (completed 100% / current 50% / locked empty)
 * - Tapping any lesson opens the 4-in-1 Learning Materials Hub
 */
export function ModuleDetail({ level, module }: ModuleDetailProps) {
  const ui = useUI();

  // Local state to track completed topics and immediately update visuals on complete
  const [completedTopicMap, setCompletedTopicMap] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    module.topics.forEach((t) => {
      if (t.studied) map[t.id] = true;
    });
    return map;
  });

  function handleTopicComplete(topicId: number) {
    setCompletedTopicMap((prev) => ({ ...prev, [topicId]: true }));
  }

  function handleOpenTopic(topic: CurriculumTopic, state: 'completed' | 'current' | 'locked') {
    if (state === 'locked') {
      haptic('warning');
      ui.toast('Avval oldingi darsni yakunlang!', 'info');
      return;
    }

    haptic('light');
    ui.openSheet({
      key: `topic-hub-${topic.id}`,
      detent: 'large',
      node: (
        <TopicMaterialHubSheet
          topic={topic}
          levelCode={level.code}
          moduleCode={module.code}
          onComplete={handleTopicComplete}
        />
      )
    });
  }

  return (
    <PushScreen
      title={module.title}
      backTitle={t.tabLessons}
      onBack={ui.pop}
    >
      <div className="space-y-3 px-4 pb-20 pt-1">
        {/* Direct 1x1 Ordered Lesson List */}
        <div className="space-y-2.5">
          {module.topics.map((topic, index) => {
            const completed = !!completedTopicMap[topic.id] || topic.studied;

            // First uncompleted topic is 'current', everything after it is 'locked'
            const allPreviousDone = module.topics
              .slice(0, index)
              .every((t) => !!completedTopicMap[t.id] || t.studied);
            const current = !completed && allPreviousDone;

            const state: 'completed' | 'current' | 'locked' = completed
              ? 'completed'
              : current
              ? 'current'
              : 'locked';

            const totalTopicSecs = topic.content.videos.reduce((acc, v) => acc + v.seconds, 0);
            const numStr = String(index + 1).padStart(2, '0');

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleOpenTopic(topic, state)}
                className={[
                  'group flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99] hover:border-slate-300 dark:hover:border-slate-700',
                  current
                    ? 'border-blue-500/50 bg-blue-50/40 shadow-sm dark:bg-blue-950/20 dark:border-blue-400/40 ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
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
                      : 'text-slate-400 dark:text-slate-500'
                  ].join(' ')}
                >
                  {numStr}
                </span>

                {/* Title, material resources count & progress */}
                <div className="min-w-0 flex-1">
                  <p
                    className={[
                      'font-sans text-sm font-semibold truncate',
                      current ? 'text-blue-900 dark:text-blue-100 font-bold' : 'text-foreground'
                    ].join(' ')}
                  >
                    {topic.title}
                  </p>
                  <p className="mt-0.5 font-sans text-xs text-mutedfg flex items-center gap-1.5">
                    <span>{formatDuration(totalTopicSecs || 694)}</span>
                    <span>•</span>
                    <span className="text-primary font-medium">4 ta o‘quv resursi</span>
                  </p>

                  {/* Per-lesson progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={[
                        'h-1.5 flex-1 overflow-hidden rounded-full',
                        current
                          ? 'bg-blue-100 dark:bg-blue-950/60'
                          : 'bg-slate-100 dark:bg-slate-800'
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'h-full rounded-full transition-all duration-500',
                          completed
                            ? 'w-full bg-emerald-500'
                            : current
                            ? 'w-1/2 bg-blue-600 dark:bg-blue-500'
                            : 'w-0 bg-transparent'
                        ].join(' ')}
                      />
                    </div>
                    {(completed || current) && (
                      <span
                        className={[
                          'shrink-0 font-sans text-[10px] font-bold tabular-nums',
                          completed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                        ].join(' ')}
                      >
                        {completed ? '100%' : '50%'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Circular action button on the right */}
                <div className="shrink-0">
                  {completed ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <CheckCircle2Icon size={18} strokeWidth={2.4} />
                    </div>
                  ) : current ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform active:scale-90">
                      <ChevronRightIcon size={18} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-500">
                      <ChevronRightIcon size={16} strokeWidth={2.2} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PushScreen>
  );
}
