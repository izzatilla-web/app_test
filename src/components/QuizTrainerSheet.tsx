import React, { useState } from 'react';
import { CheckIcon, XIcon, RotateCcwIcon, CheckCircle2Icon } from 'lucide-react';
import { Sheet } from './Sheet';
import { haptic } from '../tokens';
import type { CurriculumTopic, TopicQuiz, QuizQuestion } from '../curriculum';
import { useUI } from '../ui';

interface QuizTrainerSheetProps {
  topic: CurriculumTopic;
  quiz?: TopicQuiz;
}

export function QuizTrainerSheet({ topic, quiz: propQuiz }: QuizTrainerSheetProps) {
  const { closeSheet } = useUI();

  // Resolve quiz data or defaults based on topic
  const quiz: TopicQuiz = propQuiz || topic.content.quiz || {
    title: `${topic.title} — Test va Mashqlar`,
    questionCount: 4,
    questions: [
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
        explanation: 'O‘nli kasrni foizga aylantirish uchun uni 100 ga ko‘paytiriladi: 0.45 × 100 = 45%.'
      },
      {
        id: 4,
        question: 'Sinfdagi 30 o‘quvchidan 18 tasi o‘g‘il bola. O‘g‘il bolalar sinfning necha foizini tashkil qiladi?',
        options: ['50%', '55%', '60%', '65%'],
        answerIndex: 2,
        explanation: '(18 / 30) × 100% = 0.60 × 100% = 60%.'
      }
    ]
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ: QuizQuestion = quiz.questions[currentIndex] || quiz.questions[0];
  const isAnswered = selectedOption !== null;

  function handleSelect(index: number) {
    if (isAnswered) return;
    setSelectedOption(index);

    if (index === currentQ.answerIndex) {
      haptic('success');
      setScore((s) => s + 1);
    } else {
      haptic('warning');
    }
  }

  function handleNext() {
    if (currentIndex < quiz.questions.length - 1) {
      haptic('light');
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      haptic('success');
      setIsFinished(true);
    }
  }

  function handleRestart() {
    haptic('light');
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  }

  const percent = Math.round((score / quiz.questions.length) * 100);

  return (
    <Sheet
      title={topic.title}
      subtitle={
        <div className="font-sans text-xs pt-0.5 text-mutedfg">
          Mavzu yuzasidan test va mashqlar
        </div>
      }
      detent="large"
      onClose={closeSheet}
    >
      <div className="space-y-4 px-4 pb-10 pt-1">
        {isFinished ? (
          /* ── Apple-Style Result Screen ── */
          <div className="space-y-6 py-4 text-center">
            {/* Score Ring / Badge */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="font-display text-2xl font-bold">
                {percent}%
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {percent >= 75 ? 'Ajoyib natija!' : percent >= 50 ? 'Yaxshi natija!' : 'Mashq yakunlandi'}
              </h3>
              <p className="mt-1 font-sans text-xs text-mutedfg">
                Siz {quiz.questions.length} ta savoldan {score} tasiga to‘g‘ri javob berdingiz.
              </p>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 font-sans text-xs font-semibold text-foreground shadow-2xs transition-transform active:scale-[0.98] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <RotateCcwIcon size={14} />
                Qayta ishlash
              </button>

              <button
                type="button"
                onClick={closeSheet}
                className="flex flex-1 items-center justify-center rounded-2xl bg-primary py-3 font-sans text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-primary/95"
              >
                Tugatish
              </button>
            </div>
          </div>
        ) : (
          /* ── Apple-Style Active Question ── */
          <>
            {/* iOS Segmented Progress Bar */}
            <div className="flex items-center gap-1.5">
              {quiz.questions.map((_, idx) => {
                const isPast = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    className={[
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      isPast
                        ? 'bg-primary'
                        : isCurrent
                        ? 'bg-primary/90 ring-2 ring-primary/20'
                        : 'bg-slate-100 dark:bg-slate-800'
                    ].join(' ')}
                  />
                );
              })}
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-mutedfg">
                Savol {currentIndex + 1} / {quiz.questions.length}
              </div>
              <h3 className="mt-1.5 font-display text-base sm:text-lg font-bold text-foreground leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isCorrect = optIdx === currentQ.answerIndex;
                const isUserChoice = optIdx === selectedOption;

                let cardStyle = 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700';
                let circleStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                if (isAnswered) {
                  if (isCorrect) {
                    cardStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30';
                    circleStyle = 'bg-emerald-600 text-white';
                  } else if (isUserChoice) {
                    cardStyle = 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/30';
                    circleStyle = 'bg-rose-500 text-white';
                  } else {
                    cardStyle = 'opacity-40 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelect(optIdx)}
                    disabled={isAnswered}
                    className={[
                      'group flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all duration-150 active:scale-[0.99] shadow-2xs',
                      cardStyle
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={[
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold transition-colors',
                        circleStyle
                      ].join(' ')}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="font-sans text-sm font-medium text-foreground truncate">
                        {option}
                      </span>
                    </div>

                    {isAnswered && isCorrect && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                        <CheckIcon size={14} strokeWidth={3} />
                      </span>
                    )}
                    {isAnswered && isUserChoice && !isCorrect && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
                        <XIcon size={14} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Step-by-Step Explanation & Next Button */}
            {isAnswered && (
              <div className="space-y-3 pt-1">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3.5 font-sans text-xs leading-relaxed text-mutedfg dark:border-slate-800 dark:bg-slate-900/60">
                  <span className="font-semibold text-foreground">Tushuntirish: </span>
                  {currentQ.explanation}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary font-sans text-xs sm:text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-primary/95"
                >
                  {currentIndex < quiz.questions.length - 1 ? 'Keyingi savol' : 'Natijani ko‘rish'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
