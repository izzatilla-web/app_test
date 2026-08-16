import { useState } from 'react';
import { PlayIcon, CheckCircle2Icon, FilmIcon } from 'lucide-react';
import { Sheet } from './Sheet';
import { t } from '../strings';
import { formatDuration, haptic } from '../tokens';
import type { TopicVideo } from '../curriculum';
import { useUI } from '../ui';

/**
 * Minimal, clean, and user-friendly Video Sheet for lessons.
 */
export function VideoSheet({ video, topicTitle }: { video: TopicVideo; topicTitle: string }) {
  const { closeSheet, toast } = useUI();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Sheet
      title={topicTitle}
      subtitle={`${formatDuration(video.seconds)} · ${video.watched ? t.lsWatched : t.lsNotWatched}`}
      detent="medium"
      onClose={closeSheet}
    >
      <div className="space-y-4 px-4 pb-6">
        {/* Video Player Card */}
        {video.url ? (
          <video
            src={video.url}
            poster={video.thumbnail ?? undefined}
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
                haptic('medium');
                setIsPlaying(true);
                toast("Video dars boshlandi", "info");
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md shadow-md transition-transform active:scale-95 hover:bg-white/30"
              aria-label="Videoni qo'yish"
            >
              <PlayIcon size={24} className="ml-1 fill-current" />
            </button>

            <div>
              <p className="font-sans text-base font-bold text-white">
                {video.title}
              </p>
              <p className="mt-0.5 font-sans text-xs text-blue-100">
                Davomiyligi: {formatDuration(video.seconds)} · HD sifatda
              </p>
            </div>
          </div>
        )}

        {/* Video Description / Context */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Dars haqida
          </p>
          <p className="mt-1 font-sans text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {topicTitle} mavzusi bo'yicha tushuntirish, asosiy formulalar va misollar yechimi.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            haptic('success');
            toast("Mavzu o'rganildi deb belgilandi!", 'good');
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
