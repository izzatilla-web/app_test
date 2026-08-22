import React from 'react';
import { FileTextIcon, GraduationCapIcon, ListChecksIcon, UsersIcon } from 'lucide-react';
import { Card } from './Card';
import { ListGroup, ListRow } from './List';
import { StatusPill } from './StatusPill';
import { EmptyState } from './EmptyState';
import { ScanViewer } from '../screens/ScanViewer';
import { t } from '../strings';
import { mediumDate } from '../tokens';
import { examPill, topicPill } from '../utils/status';
import type { Exam, SupportSession, Topic } from '../mockData';
import { useUI } from '../ui';

export function CurriculumSection({
  topics,
  done,
  total
}: {
  topics: Topic[];
  done: number;
  total: number;
}) {
  if (topics.length === 0) {
    return (
      <div className="px-4">
        <Card>
          <EmptyState icon={ListChecksIcon} title={t.emptyTopicsTitle} compact />
        </Card>
      </div>
    );
  }

  return (
    <ListGroup header={t.curriculumHeader}>
      <div className="border-b border-hairline px-4 py-3">
        <div className="h-[6px] w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-sans text-xs font-medium tabular-nums text-mutedfg">
          {t.topicsProgress(done, total)}
        </p>
      </div>
      {topics.map((topic, i) => {
        const pill = topicPill(topic.status);
        return (
          <ListRow
            key={topic.id}
            last={i === topics.length - 1}
            label={topic.title}
            value={
              topic.examScore !== null ? (
                <span className="font-semibold text-foreground">{topic.examScore}</span>
              ) : undefined
            }
            trailing={<StatusPill tone={pill.tone} label={pill.label} />}
          />
        );
      })}
    </ListGroup>
  );
}

export function ExamsSection({
  exams,
  className = 'px-4'
}: {
  exams: Exam[];
  className?: string;
}) {
  const { openFullScreen, closeFullScreen } = useUI();

  if (exams.length === 0) {
    return (
      <div className={className}>
        <h2 className="mb-2.5 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t.examsHeader}
        </h2>
        <Card>
          <EmptyState icon={GraduationCapIcon} title={t.emptyExamsTitle} compact />
        </Card>
      </div>
    );
  }

  return (
    <section className={className}>
      <h2 className="mb-2.5 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t.examsHeader}
      </h2>
      <div className="space-y-3">
        {exams.map((exam) => {
          const pill = examPill(exam.result);
          return (
            <div
              key={exam.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              {/* Top Row: Title, Date & Big Clean Score */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans text-[15px] font-bold tracking-tight text-foreground truncate">
                    {exam.topic}
                  </h3>
                  <p className="mt-0.5 font-sans text-xs font-medium text-mutedfg">
                    {mediumDate(exam.date)}
                  </p>
                </div>
                <span className="font-display text-2xl font-bold tracking-tight tabular-nums text-foreground shrink-0">
                  {exam.score}
                </span>
              </div>

              {/* Status Pill Badge */}
              <div className="mt-2.5">
                <StatusPill tone={pill.tone} label={pill.label} />
              </div>

              {/* Teacher Comment */}
              {exam.comment && (
                <p className="mt-2.5 font-sans text-xs leading-relaxed italic text-slate-600 dark:text-slate-300">
                  «{exam.comment}»
                </p>
              )}

              {/* Bottom Action & Grader Row */}
              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                {exam.hasScan ? (
                  <button
                    type="button"
                    onClick={() =>
                      openFullScreen(<ScanViewer exam={exam} onClose={closeFullScreen} />)
                    }
                    className="flex items-center gap-1.5 font-sans text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 active:opacity-75 dark:text-blue-400"
                  >
                    <FileTextIcon size={14} />
                    {t.examViewScan}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 font-sans text-xs text-mutedfg">
                    <FileTextIcon size={14} />
                    {t.examNoScan}
                  </span>
                )}
                <span className="font-sans text-xs font-medium text-mutedfg">{exam.gradedBy}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SupportSection({ sessions }: { sessions: SupportSession[] }) {
  if (sessions.length === 0) return null;
  return (
    <ListGroup header={t.supportHeader}>
      {sessions.map((session, i) => (
        <ListRow
          key={`${session.date}-${i}`}
          icon={UsersIcon}
          iconTone="text-mutedfg"
          last={i === sessions.length - 1}
          label={
            <span className="tabular-nums">
              {mediumDate(session.date)} · {session.time}
            </span>
          }
          secondary={
            session.attended ? t.supportAttended : session.missed ? t.supportMissed : t.supportUpcoming
          }
        />
      ))}
    </ListGroup>
  );
}