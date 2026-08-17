import React, { useState } from 'react';
import { PlayIcon, CheckCircle2Icon, FilmIcon, CheckIcon } from 'lucide-react';
import { Sheet } from './Sheet';
import { t } from '../strings';
import { formatDuration, haptic } from '../tokens';
import type { CurriculumTopic, TopicVideo } from '../curriculum';
import { useUI } from '../ui';

interface VideoSheetProps {
  topic?: CurriculumTopic;
  videos?: TopicVideo[];
  video?: TopicVideo;
  topicTitle?: string;
}

/**
 * Minimal, clean, and user-friendly Video Sheet for single and multi-video lessons.
 */
export function VideoSheet({ topic, videos: propVideos, video: propVideo, topicTitle: propTitle }: VideoSheetProps) {
  const { closeSheet, toast } = useUI();

  // Resolve videos list
  const videoList: TopicVideo[] =
    topic?.content.videos ??
    propVideos ??
    (propVideo ? [propVideo] : []);

  const title = topic?.title ?? propTitle ?? 'Video dars';
  const [activeIndex, setActiveIndex] = useState(0);

  const activeVideo = videoList[activeIndex] || videoList[0];
  const isMulti = videoList.length > 1;

  const totalSeconds = videoList.reduce((acc, v) => acc + v.seconds, 0);
  const watchedCount = videoList.filter((v) => v.watched).length;
  const allWatched = videoList.length > 0 && watchedCount === videoList.length;

  return (
    <Sheet
      title={title}
      subtitle={
        <div className="flex items-center justify-between font-sans text-xs pt-0.5">
          <span className="text-mutedfg font-medium">
            {formatDuration(isMulti ? totalSeconds : (activeVideo?.seconds || 0))}
          </span>
          <span
            className={
              allWatched || activeVideo?.watched
                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                : 'font-semibold text-slate-500 dark:text-slate-400'
            }
          >
            {isMulti
              ? `${watchedCount}/${videoList.length} ko‘rildi`
              : activeVideo?.watched
              ? t.lsWatched
              : t.lsNotWatched}
          </span>
        </div>
      }
      detent={isMulti ? 'large' : 'medium'}
      onClose={closeSheet}
    >
      <div className="space-y-4 px-4 pb-6">
        {/* ── Active Video Player Card ── */}
        {activeVideo?.url ? (
          <video
            key={activeVideo.url}
            src={activeVideo.url}
            poster={activeVideo.thumbnail ?? undefined}
            controls
            playsInline
            className="w-full rounded-2xl bg-black shadow-sm"
          />
        ) : (
          <div
            className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl p-6 text-center text-white shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                haptic('light');
                toast(`"${activeVideo?.title || title}" videosi boshlandi`, 'info');
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md shadow-md transition-transform active:scale-95 hover:bg-white/35"
              aria-label="Videoni qo'yish"
            >
              <PlayIcon size={24} className="ml-1 fill-current" />
            </button>

            <div className="relative z-10 px-4">
              <p className="font-sans text-base font-bold text-white">
                {activeVideo?.title || title}
              </p>
            </div>
          </div>
        )}

        {/* ── Multi-Video Playlist Selector (If more than 1 video) ── */}
        {isMulti && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <FilmIcon size={14} />
              <span>Dars qismlari</span>
            </div>

            <div className="space-y-1.5">
              {videoList.map((v, idx) => {
                const isActive = idx === activeIndex;

                return (
                  <button
                    key={v.title + idx}
                    type="button"
                    onClick={() => {
                      haptic('light');
                      setActiveIndex(idx);
                    }}
                    className={[
                      'group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.99]',
                      isActive
                        ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-400/40 ring-1 ring-blue-500/20'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Play / Active indicator */}
                      <div
                        className={[
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white'
                            : v.watched
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        ].join(' ')}
                      >
                        {isActive ? (
                          <PlayIcon size={12} className="ml-0.5 fill-current" />
                        ) : v.watched ? (
                          <CheckIcon size={12} strokeWidth={3} />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={[
                            'font-sans text-xs sm:text-sm font-semibold truncate',
                            isActive ? 'text-blue-900 dark:text-blue-200 font-bold' : 'text-foreground'
                          ].join(' ')}
                        >
                          {v.title}
                        </p>
                        {v.watched && (
                          <p className="mt-0.5 font-sans text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Ko‘rilgan
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={[
                        'font-sans text-xs font-semibold tabular-nums',
                        isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-mutedfg'
                      ].join(' ')}
                    >
                      {formatDuration(v.seconds)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Action Button ── */}
        <button
          type="button"
          onClick={() => {
            haptic('success');
            toast("Mavzu o‘rganildi deb belgilandi!", 'success');
            closeSheet();
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-sans text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-blue-700"
        >
          <CheckCircle2Icon size={16} />
          Mavzuni yakunlash
        </button>
      </div>
    </Sheet>
  );
}
