import React from 'react';
import { CheckIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { TopicRow } from '../components/CurriculumBrowser';
import { StatusPill } from '../components/StatusPill';
import { t } from '../strings';
import { levelProgress, moduleExam } from '../access';
import { curriculumFor } from '../curriculum';
import { examPill } from '../utils/status';
import { ASSETS_3D } from '../tokens';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';

/**
 * Level Detail Screen — Matching reference Screen 3:
 * 3D Medal completion hero, Imtihon Natijasi card with 3D book stack & cap,
 * and clean topic list.
 */
export function LevelDetail({ child, levelId }: { child: ChildRecord; levelId: number }) {
  const ui = useUI();
  const levels = curriculumFor(child.id);
  const level = levels.find((item) => item.id === levelId);
  if (!level) return null;

  const progress = levelProgress(level);

  return (
    <PushScreen
      title={`${level.code} — ${level.title}`}
      backTitle={t.tabLessons}
      onBack={ui.pop}
    >
      <div className="space-y-5 px-4 pb-16">
        {/* Top Celebration Hero */}
        <div className="flex flex-col items-center pt-2 text-center">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 font-sans text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckIcon size={12} strokeWidth={3.5} />
            {t.lsDoneBadge}
          </span>

          {/* 3D Gold Medal Asset — Transparent PNG */}
          <div className="relative my-2 flex h-32 w-32 items-center justify-center">
            <img
              src={ASSETS_3D.goldMedalRibbon}
              alt="Yutuq medali"
              className="h-full w-full object-contain drop-shadow-[0_10px_20px_rgba(234,179,8,0.25)]"
            />
          </div>

          <p className="font-sans text-xs font-semibold tabular-nums text-mutedfg">
            {progress.done} / {progress.total} mavzu · {progress.percent}%
          </p>
        </div>

        {/* Modules with Exam Cards & Topic Lists */}
        {level.modules.map((module) => {
          const exam = moduleExam(module, child);
          const pill = exam ? examPill(exam.result) : null;

          return (
            <div key={module.id} className="space-y-2.5">
              <h2 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {module.code} · {module.title}
              </h2>

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

              {/* Topics List Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-hairline bg-slate-50/60 px-4 py-2.5 dark:bg-slate-900/60">
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Mavzular
                  </p>
                </div>
                <ul className="divide-y divide-hairline">
                  {module.topics.map((topic) => (
                    <TopicRow
                      key={topic.id}
                      levels={levels}
                      module={module}
                      topic={topic}
                      current={false}
                    />
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </PushScreen>
  );
}
