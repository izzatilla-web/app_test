import React from 'react';
import { Sheet } from './Sheet';
import { VideoSheet } from './VideoSheet';
import { PresentationViewerSheet } from './PresentationViewerSheet';
import { KonspektViewerSheet } from './KonspektViewerSheet';
import { QuizTrainerSheet } from './QuizTrainerSheet';
import { ASSETS_3D, formatDuration, haptic } from '../tokens';
import type { CurriculumTopic } from '../curriculum';
import { useUI } from '../ui';

interface TopicMaterialHubSheetProps {
  topic: CurriculumTopic;
  levelCode?: string;
  moduleCode?: string;
}

export function TopicMaterialHubSheet({ topic }: TopicMaterialHubSheetProps) {
  const ui = useUI();

  const totalVideosSecs = topic.content.videos.reduce((acc, v) => acc + v.seconds, 0);
  const videoCount = topic.content.videos.length || 1;
  const fileCount = topic.content.presentation?.files?.length || 3;
  const formulaCount = topic.content.konspekt?.formulas.length || 4;
  const questionCount = topic.content.quiz?.questionCount || 4;

  function openMaterial(type: 'video' | 'presentation' | 'konspekt' | 'quiz') {
    haptic('light');
    if (type === 'video') {
      ui.openSheet({
        key: `video-sub-${topic.id}`,
        detent: topic.content.videos.length > 1 ? 'large' : 'medium',
        node: <VideoSheet topic={topic} />
      });
    } else if (type === 'presentation') {
      ui.openSheet({
        key: `pres-sub-${topic.id}`,
        detent: 'large',
        node: <PresentationViewerSheet topic={topic} />
      });
    } else if (type === 'konspekt') {
      ui.openSheet({
        key: `konspekt-sub-${topic.id}`,
        detent: 'large',
        node: <KonspektViewerSheet topic={topic} />
      });
    } else if (type === 'quiz') {
      ui.openSheet({
        key: `quiz-sub-${topic.id}`,
        detent: 'large',
        node: <QuizTrainerSheet topic={topic} />
      });
    }
  }

  return (
    <Sheet
      title={topic.title}
      subtitle={
        <div className="flex items-center gap-1.5 font-sans text-xs pt-0.5 font-medium text-primary">
          <span>4 ta o‘quv resursi</span>
        </div>
      }
      detent="large"
      onClose={ui.closeSheet}
    >
      <div className="space-y-4 px-4 pb-10 pt-1">
        {/* ── 2x2 Apple-style Learning Materials Grid ── */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* 1. Videolar (Sky Blue) */}
          <button
            type="button"
            onClick={() => openMaterial('video')}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-b from-sky-50/90 to-sky-100/50 p-4 sm:p-5 text-left shadow-xs transition-all duration-200 active:scale-[0.98] hover:border-sky-300 hover:shadow-md dark:border-sky-900/60 dark:from-sky-950/40 dark:to-sky-900/20 dark:hover:border-sky-800"
          >
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img
                src={ASSETS_3D.matVideo}
                alt="Videolar"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="mt-4">
              <h3 className="font-display text-base font-bold text-foreground">
                Videolar
              </h3>
              <p className="mt-0.5 font-sans text-xs text-mutedfg">
                {videoCount} ta video · {formatDuration(totalVideosSecs || 694)}
              </p>
            </div>
          </button>

          {/* 2. Prezentatsiyalar (Indigo / Violet) */}
          <button
            type="button"
            onClick={() => openMaterial('presentation')}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-indigo-100/50 p-4 sm:p-5 text-left shadow-xs transition-all duration-200 active:scale-[0.98] hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-indigo-900/20 dark:hover:border-indigo-800"
          >
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img
                src={ASSETS_3D.matPresentation}
                alt="Prezentatsiya"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="mt-4">
              <h3 className="font-display text-base font-bold text-foreground">
                Prezentatsiya
              </h3>
              <p className="mt-0.5 font-sans text-xs text-mutedfg">
                {fileCount} ta fayl · Taqdimot
              </p>
            </div>
          </button>

          {/* 3. Konspekt (Amber / Gold) */}
          <button
            type="button"
            onClick={() => openMaterial('konspekt')}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-amber-100/50 p-4 sm:p-5 text-left shadow-xs transition-all duration-200 active:scale-[0.98] hover:border-amber-300 hover:shadow-md dark:border-amber-900/60 dark:from-amber-950/40 dark:to-amber-900/20 dark:hover:border-amber-800"
          >
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img
                src={ASSETS_3D.matKonspekt}
                alt="Konspekt"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="mt-4">
              <h3 className="font-display text-base font-bold text-foreground">
                Konspekt
              </h3>
              <p className="mt-0.5 font-sans text-xs text-mutedfg">
                Qoidalar & {formulaCount} formula
              </p>
            </div>
          </button>

          {/* 4. Savollar & Mashqlar (Emerald / Teal) */}
          <button
            type="button"
            onClick={() => openMaterial('quiz')}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 p-4 sm:p-5 text-left shadow-xs transition-all duration-200 active:scale-[0.98] hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:hover:border-emerald-800"
          >
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img
                src={ASSETS_3D.matQuiz}
                alt="Savollar"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="mt-4">
              <h3 className="font-display text-base font-bold text-foreground">
                Savollar & Test
              </h3>
              <p className="mt-0.5 font-sans text-xs text-mutedfg">
                {questionCount} ta mashq · Savollar
              </p>
            </div>
          </button>
        </div>
      </div>
    </Sheet>
  );
}
