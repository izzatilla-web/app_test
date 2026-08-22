import React, { useState } from 'react';
import {
  PlayIcon,
  CheckCircle2Icon,
  FilmIcon,
  BookOpenIcon,
  CheckIcon,
  FileTextIcon,
  DownloadIcon,
  HelpCircleIcon,
  RotateCcwIcon,
  XIcon,
  LayersIcon
} from 'lucide-react';
import { Sheet } from './Sheet';
import { formatDuration, haptic } from '../tokens';
import type { CurriculumTopic, TopicVideo, TopicDocumentFile, QuizQuestion } from '../curriculum';
import { useUI } from '../ui';

interface TopicMaterialHubSheetProps {
  topic: CurriculumTopic;
  levelCode?: string;
  moduleCode?: string;
  onComplete?: (topicId: number) => void;
}

function getTopicMaterials(topic: CurriculumTopic) {
  const title = topic.title;

  const videos: TopicVideo[] = topic.content.videos.length > 0
    ? topic.content.videos
    : [
        {
          title: `${title} — Asosiy tushuncha`,
          seconds: 694,
          thumbnail: null,
          url: null,
          watched: false
        },
        {
          title: `${title} — Misollar yechish`,
          seconds: 458,
          thumbnail: null,
          url: null,
          watched: false
        }
      ];

  const konspektFiles: TopicDocumentFile[] = [
    {
      id: 101,
      title: `${title} — Asosiy Konspekt & Formulalar`,
      fileName: `${title.replace(/\s+/g, '_')}_Konspekt.pdf`,
      sizeStr: '1.6 MB',
      fileType: 'pdf',
      pageCount: 6
    },
    {
      id: 102,
      title: 'Qoidalar va Misollar to‘plami',
      fileName: `${title.replace(/\s+/g, '_')}_Qoidalar.pdf`,
      sizeStr: '1.2 MB',
      fileType: 'pdf',
      pageCount: 4
    }
  ];

  const presentationFiles: TopicDocumentFile[] = topic.content.presentation?.files || [
    {
      id: 201,
      title: `${title} — Asosiy Taqdimot`,
      fileName: `${title.replace(/\s+/g, '_')}_Taqdimot.pdf`,
      sizeStr: '3.4 MB',
      fileType: 'pdf',
      pageCount: 18
    },
    {
      id: 202,
      title: 'Ko‘rgazmali dars slaydlari',
      fileName: 'Dars_Slaydlari.pptx',
      sizeStr: '5.2 MB',
      fileType: 'pptx',
      pageCount: 12
    }
  ];

  const questions: QuizQuestion[] = topic.content.quiz?.questions || [
    {
      id: 1,
      question: '60 sonining 25% qismi nechaga teng?',
      options: ['12', '15', '20', '25'],
      answerIndex: 1,
      explanation: '60 × (25 / 100) = 60 × 0.25 = 15 yoki 60 / 4 = 15.'
    },
    {
      id: 2,
      question: 'Qaysi sonning 20% qismi 18 ga teng?',
      options: ['72', '80', '90', '100'],
      answerIndex: 2,
      explanation: '18 / 0.2 = 90 yoki (18 × 100) / 20 = 90.'
    },
    {
      id: 3,
      question: '0.45 o‘nli kasr necha foizni bildiradi?',
      options: ['4.5%', '45%', '450%', '0.45%'],
      answerIndex: 1,
      explanation: 'O‘nli kasrni foizga aylantirish uchun 100 ga ko‘paytiriladi: 0.45 × 100 = 45%.'
    },
    {
      id: 4,
      question: 'Sinfdagi 30 o‘quvchidan 18 tasi o‘g‘il bola. Ular sinfning necha foizi?',
      options: ['50%', '55%', '60%', '65%'],
      answerIndex: 2,
      explanation: '(18 / 30) × 100% = 0.60 × 100% = 60%.'
    }
  ];

  return { videos, konspektFiles, presentationFiles, questions };
}

/**
 * Pure Apple Minimalist Topic Materials Sheet:
 * Direct, flat, single scrollable view.
 * 1. Video darslar (Sky Blue)
 * 2. Konspekt PDF fayllari (Amber / Gold)
 * 3. Prezentatsiya PDF/PPTX fayllari (Indigo / Violet)
 * 4. Savollar & Amaliy Test (Emerald / Teal)
 */
export function TopicMaterialHubSheet({ topic, onComplete }: TopicMaterialHubSheetProps) {
  const ui = useUI();
  const { videos, konspektFiles, presentationFiles, questions } = getTopicMaterials(topic);

  // Video State
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Record<number, boolean>>({});

  // Quiz State
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const activeVideo = videos[activeVideoIdx] || videos[0];
  const totalVideoSecs = videos.reduce((acc, v) => acc + v.seconds, 0);
  const currentQ = questions[currentQIdx] || questions[0];
  const isQuestionAnswered = selectedOpt !== null;

  function playVideo(index: number) {
    setActiveVideoIdx(index);
    haptic('light');
    setWatchedVideos((prev) => ({ ...prev, [index]: true }));
    ui.toast(`"${videos[index]?.title}" videosi boshlandi`, 'info');
  }

  function downloadFile(file: TopicDocumentFile, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    haptic('success');
    ui.toast(`"${file.fileName}" yuklab olinmoqda...`, 'success');
  }

  function selectQuizOption(optIdx: number) {
    if (isQuestionAnswered) return;
    setSelectedOpt(optIdx);

    if (optIdx === currentQ.answerIndex) {
      haptic('success');
      setQuizScore((s) => s + 1);
    } else {
      haptic('warning');
    }
  }

  function nextQuizQuestion() {
    if (currentQIdx < questions.length - 1) {
      haptic('light');
      setCurrentQIdx((i) => i + 1);
      setSelectedOpt(null);
    } else {
      haptic('success');
      setQuizFinished(true);
    }
  }

  function restartQuiz() {
    haptic('light');
    setCurrentQIdx(0);
    setSelectedOpt(null);
    setQuizScore(0);
    setQuizFinished(false);
  }

  const quizPercent = Math.round((quizScore / questions.length) * 100);

  return (
    <Sheet
      title={topic.title}
      detent="large"
      onClose={ui.closeSheet}
    >
      <div className="space-y-5 px-4 pb-10 pt-1">
        {/* ══════════════════════════════════════════════════════════════════
            1. VIDEOLAR (Sky Blue Theme - Direct, Flat Apple Style)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <FilmIcon size={14} className="text-sky-600 dark:text-sky-400" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Video dars
              </h3>
            </div>
            <span className="font-sans text-xs font-medium text-mutedfg tabular-nums">
              {formatDuration(totalVideoSecs)}
            </span>
          </div>

          {/* Direct Video Player */}
          {activeVideo?.url ? (
            <video
              key={activeVideo.url}
              src={activeVideo.url}
              poster={activeVideo.thumbnail ?? undefined}
              controls
              playsInline
              className="aspect-video w-full rounded-2xl bg-black shadow-xs"
            />
          ) : (
            <div
              className="relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl p-5 text-center text-white shadow-xs"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%)'
              }}
            >
              <button
                type="button"
                onClick={() => playVideo(activeVideoIdx)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md shadow-md transition-all active:scale-95 hover:bg-white/35"
                aria-label="Videoni ko‘rish"
              >
                <PlayIcon size={20} className="ml-0.5 fill-current" />
              </button>

              <div className="relative z-10 px-2">
                <p className="font-sans text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1">
                  {activeVideo?.title || topic.title}
                </p>
                <p className="mt-0.5 font-sans text-[11px] text-sky-100 tabular-nums">
                  {formatDuration(activeVideo?.seconds || 694)}
                </p>
              </div>
            </div>
          )}

          {/* Playlist selector (if more than 1 video) - Flat list directly under video */}
          {videos.length > 1 && (
            <div className="space-y-1 pt-1">
              {videos.map((v, idx) => {
                const isActive = idx === activeVideoIdx;
                const isWatched = watchedVideos[idx] || v.watched;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => playVideo(idx)}
                    className={[
                      'flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 active:scale-[0.99]',
                      isActive
                        ? 'border-sky-400/60 bg-sky-50/70 dark:bg-sky-950/40 dark:border-sky-500/40 ring-1 ring-sky-500/20'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={[
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                          isActive
                            ? 'bg-sky-600 text-white'
                            : isWatched
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        ].join(' ')}
                      >
                        {isActive ? (
                          <PlayIcon size={9} className="ml-0.5 fill-current" />
                        ) : isWatched ? (
                          <CheckIcon size={10} strokeWidth={3} />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      <p
                        className={[
                          'font-sans text-xs font-semibold truncate',
                          isActive ? 'text-sky-900 dark:text-sky-200 font-bold' : 'text-foreground'
                        ].join(' ')}
                      >
                        {v.title}
                      </p>
                    </div>

                    <span className="font-sans text-[11px] font-medium text-mutedfg tabular-nums ml-2 shrink-0">
                      {formatDuration(v.seconds)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            2. KONSPEKT & QOIDALAR (Amber / Warm Gold - PDF Files List)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <BookOpenIcon size={14} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Konspekt
              </h3>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-2xs divide-y divide-amber-100/70 dark:border-amber-900/40 dark:bg-slate-900 dark:divide-slate-800">
            {konspektFiles.map((file) => (
              <div
                key={file.id}
                onClick={(e) => downloadFile(file, e)}
                className="group flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <FileTextIcon size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      {file.title}
                    </h4>
                    <p className="font-sans text-[11px] text-mutedfg">
                      {file.sizeStr}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => downloadFile(file, e)}
                  aria-label="Yuklab olish"
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-amber-600 hover:text-white active:scale-90 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-600 dark:hover:text-white"
                >
                  <DownloadIcon size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. PREZENTATSIYA & FAYLLAR (Indigo / Violet - Direct File Rows)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <LayersIcon size={14} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Prezentatsiya & Slaydlar
              </h3>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-2xs divide-y divide-indigo-100/70 dark:border-indigo-900/40 dark:bg-slate-900 dark:divide-slate-800">
            {presentationFiles.map((file) => (
              <div
                key={file.id}
                onClick={(e) => downloadFile(file, e)}
                className="group flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <FileTextIcon size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {file.title}
                    </h4>
                    <p className="font-sans text-[11px] text-mutedfg">
                      {file.sizeStr}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => downloadFile(file, e)}
                  aria-label="Yuklab olish"
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-indigo-600 hover:text-white active:scale-90 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-600 dark:hover:text-white"
                >
                  <DownloadIcon size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. SAVOLLAR & TEST (Emerald / Mint Theme)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <HelpCircleIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Savollar & Test
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-white p-3.5 shadow-2xs space-y-3 dark:border-emerald-900/40 dark:bg-slate-900">
            {quizFinished ? (
              /* ── Apple-Style Result ── */
              <div className="py-2 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-400">
                  <span className="font-display text-lg font-bold">
                    {quizPercent}%
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    {quizPercent >= 75 ? 'Ajoyib natija! 🎉' : quizPercent >= 50 ? 'Yaxshi natija! 👍' : 'Mashq yakunlandi'}
                  </h4>
                  <p className="mt-0.5 font-sans text-xs text-mutedfg">
                    {questions.length} ta savoldan {quizScore} tasiga to‘g‘ri javob berdingiz.
                  </p>
                </div>

                <div className="flex w-full gap-2 pt-1">
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 font-sans text-xs font-semibold text-foreground shadow-2xs transition-all active:scale-[0.98] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <RotateCcwIcon size={12} />
                    Qayta ishlash
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic('success');
                      topic.studied = true;
                      onComplete?.(topic.id);
                      ui.toast('Mashq yakunlandi va mavzu o‘zlashtirildi!', 'success');
                      ui.closeSheet();
                    }}
                    className="flex flex-1 items-center justify-center rounded-xl bg-emerald-600 py-2 font-sans text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] hover:bg-emerald-700"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            ) : (
              /* ── Active Question ── */
              <div className="space-y-2.5">
                {/* Progress bar */}
                <div className="flex items-center gap-1">
                  {questions.map((_, idx) => {
                    const isPast = idx < currentQIdx;
                    const isCurrent = idx === currentQIdx;
                    return (
                      <div
                        key={idx}
                        className={[
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          isPast
                            ? 'bg-emerald-600'
                            : isCurrent
                            ? 'bg-emerald-500 ring-1 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800'
                        ].join(' ')}
                      />
                    );
                  })}
                </div>

                {/* Question */}
                <p className="font-display text-xs sm:text-sm font-bold text-foreground leading-snug pt-0.5">
                  {currentQ.question}
                </p>

                {/* Options List */}
                <div className="space-y-1.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === currentQ.answerIndex;
                    const isUserChoice = optIdx === selectedOpt;

                    let optStyle = 'border-slate-200/80 bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900';
                    let badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                    if (isQuestionAnswered) {
                      if (isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30';
                        badgeStyle = 'bg-emerald-600 text-white';
                      } else if (isUserChoice) {
                        optStyle = 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/30';
                        badgeStyle = 'bg-rose-500 text-white';
                      } else {
                        optStyle = 'opacity-40 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => selectQuizOption(optIdx)}
                        disabled={isQuestionAnswered}
                        className={[
                          'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all duration-150 active:scale-[0.99]',
                          optStyle
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={[
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-bold',
                              badgeStyle
                            ].join(' ')}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="font-sans text-xs font-medium text-foreground truncate">
                            {opt}
                          </span>
                        </div>

                        {isQuestionAnswered && isCorrect && (
                          <CheckIcon size={12} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                        )}
                        {isQuestionAnswered && isUserChoice && !isCorrect && (
                          <XIcon size={12} className="text-rose-600 dark:text-rose-400" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Next */}
                {isQuestionAnswered && (
                  <div className="space-y-2 pt-0.5">
                    <p className="font-sans text-[11px] text-mutedfg leading-relaxed">
                      <span className="font-semibold text-foreground">Izoh: </span>
                      {currentQ.explanation}
                    </p>

                    <button
                      type="button"
                      onClick={nextQuizQuestion}
                      className="flex h-9 w-full items-center justify-center rounded-xl bg-emerald-600 font-sans text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] hover:bg-emerald-700"
                    >
                      {currentQIdx < questions.length - 1 ? 'Keyingi savol' : 'Natijani ko‘rish'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Bottom Done Action ── */}
        <button
          type="button"
          onClick={() => {
            haptic('success');
            topic.studied = true;
            onComplete?.(topic.id);
            ui.toast('Mavzu o‘zlashtirildi deb belgilandi!', 'success');
            ui.closeSheet();
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-sans text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] hover:bg-primary/95"
        >
          <CheckCircle2Icon size={16} />
          Mavzuni yakunlash
        </button>
      </div>
    </Sheet>
  );
}
