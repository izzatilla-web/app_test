import { CheckIcon, ChevronRightIcon, PlayIcon, LockIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { StatusPill } from '../components/StatusPill';
import { VideoSheet } from '../components/VideoSheet';
import { t } from '../strings';
import { formatDuration, haptic, ASSETS_3D, getLevel3DAsset } from '../tokens';
import { levelProgress, moduleExam, topicAccess } from '../access';
import { curriculumFor } from '../curriculum';
import type { CurriculumTopic } from '../curriculum';
import { examPill } from '../utils/status';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';
import { ModuleDetail } from './ModuleDetail';

/**
 * Level Detail Screen — Matching reference Screen 3:
 * Dynamic Status (Yakunlandi / O'rganilmoqda / O'tilmagan), 3D Medal with Celebration Confetti,
 * Imtihon Natijasi card with 3D book stack & cap, and clean module/topic list.
 */
export function LevelDetail({ child, levelId }: { child: ChildRecord; levelId: number }) {
  const ui = useUI();
  const levels = curriculumFor(child.id);
  const currentLevel = levels.find((item) => item.id === levelId);
  if (!currentLevel) return null;

  const progress = levelProgress(currentLevel);
  const isFinished = progress.percent === 100;
  const isInProgress = progress.percent > 0 && progress.percent < 100;
  const heroAsset = isFinished ? ASSETS_3D.goldMedalRibbon : getLevel3DAsset(currentLevel.code);

  function openModule(moduleIndex: number) {
    const targetModule = currentLevel?.modules[moduleIndex];
    if (!targetModule || !currentLevel) return;
    haptic('light');
    ui.push({
      key: `module-${targetModule.id}`,
      backTitle: currentLevel.code,
      node: <ModuleDetail child={child} levels={levels} level={currentLevel} module={targetModule} />
    });
  }

  function openVideo(topic: CurriculumTopic) {
    if (!topic.content.videos.length) return;
    haptic('light');
    ui.openSheet({
      key: `video-${topic.id}`,
      detent: topic.content.videos.length > 1 ? 'large' : 'medium',
      node: <VideoSheet topic={topic} />
    });
  }

  return (
    <PushScreen
      title={`${currentLevel.code} — ${currentLevel.title}`}
      backTitle={t.tabLessons}
      onBack={ui.pop}
    >
      <div className="space-y-5 px-4 pb-20">
        {/* Top Status Hero — Dynamic based on level completion */}
        <div className="flex flex-col items-center pt-2 text-center">
          {isFinished ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 font-sans text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckIcon size={12} strokeWidth={3.5} />
              {t.lsDoneBadge}
            </span>
          ) : isInProgress ? (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 font-sans text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              {t.lsInProgressBadge}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 font-sans text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <LockIcon size={12} />
              {t.lsLockedBadge}
            </span>
          )}

          {/* 3D Asset Container */}
          <div className="relative my-2 flex h-32 w-32 items-center justify-center overflow-visible">
            <img
              src={heroAsset}
              alt={currentLevel.title}
              className={[
                'h-full w-full object-contain transition-all duration-300 relative z-10',
                isFinished
                  ? 'drop-shadow-[0_12px_24px_rgba(234,179,8,0.3)]'
                  : isInProgress
                  ? 'drop-shadow-[0_10px_20px_rgba(59,130,246,0.25)]'
                  : 'opacity-75 grayscale-[0.25] drop-shadow-sm'
              ].join(' ')}
            />
          </div>

          <p className="font-sans text-xs font-semibold tabular-nums text-mutedfg">
            {progress.done} / {progress.total} mavzu · {progress.percent}%
          </p>
        </div>

        {/* Modules with Exam Cards & Topic Lists */}
        {currentLevel.modules.map((module, mIdx) => {
          const exam = moduleExam(module, child);
          const pill = exam ? examPill(exam.result) : null;

          return (
            <div key={module.id} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {module.code} · {module.title}
                </h2>
                <button
                  type="button"
                  onClick={() => openModule(mIdx)}
                  className="font-sans text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
                >
                  Batafsil
                  <ChevronRightIcon size={14} />
                </button>
              </div>

              {/* Imtihon Natijasi Card with 3D Books & Graduation Cap */}
              {exam && pill && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {t.lsExamResult}
                      </p>
                      <StatusPill tone={pill.tone} label={pill.label} />
                    </div>

                    <p className="mt-1 font-sans text-xl font-bold tabular-nums text-foreground">
                      {exam.score}
                      <span className="ml-1 font-sans text-xs font-normal text-mutedfg">/ 100</span>
                    </p>

                    <div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="bar-fill h-full rounded-full"
                        style={{
                          width: `${exam.score}%`,
                          backgroundColor:
                            exam.result === 'pass'
                              ? 'hsl(var(--good))'
                              : exam.result === 'conditional'
                              ? 'hsl(var(--warn))'
                              : 'hsl(var(--bad))'
                        }}
                      />
                    </div>
                  </div>

                  {/* 3D Stack of books & Cap — Transparent PNG */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                    <img
                      src={ASSETS_3D.gradCapBooks}
                      alt="Imtihon natijasi"
                      className="h-full w-full object-contain drop-shadow-md"
                    />
                  </div>
                </div>
              )}

              {/* Clean 1x1 Topics List Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 divide-y divide-hairline">
                {module.topics.map((topic, tIdx) => {
                  const state = topicAccess(levels, topic);
                  const locked = state === 'locked';
                  const completed = state === 'completed';
                  const numStr = String(tIdx + 1).padStart(2, '0');

                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => openVideo(topic)}
                      className="flex w-full items-center gap-3.5 p-3.5 text-left transition-colors duration-100 active:bg-slate-50 dark:active:bg-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <span className="font-display text-sm font-bold text-slate-400 dark:text-slate-500 w-6 text-center">
                        {numStr}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-xs font-semibold text-foreground truncate">
                          {topic.title}
                        </p>
                        <p className="mt-0.5 font-sans text-[11px] text-mutedfg">
                          {topic.content.videos[0] ? formatDuration(topic.content.videos[0].seconds) : '15 min'}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {completed ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <CheckIcon size={13} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform active:scale-90">
                            <PlayIcon size={11} className="ml-0.5 fill-current" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </PushScreen>
  );
}
