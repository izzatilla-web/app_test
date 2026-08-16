import React from 'react';
import { CalendarX2Icon } from 'lucide-react';
import { ListGroup, ListRow } from './List';
import { StatusPill } from './StatusPill';
import { EmptyState } from './EmptyState';
import { Sheet } from './Sheet';
import { t } from '../strings';
import { longDate, shortDate, haptic } from '../tokens';
import {
  conspectPill,
  engagementPill,
  homeworkPill,
  presencePill } from
'../utils/status';
import type { Lesson } from '../mockData';
import { useUI } from '../ui';

interface LessonListProps {
  lessons: Lesson[];
  group: string;
  highlightDate?: string | null;
}

export function LessonList({ lessons, group, highlightDate }: LessonListProps) {
  const { openSheet } = useUI();

  if (lessons.length === 0) {
    return (
      <EmptyState icon={CalendarX2Icon} title={t.emptyLessonsTitle} body={t.emptyLessonsBody} />);

  }

  return (
    <ListGroup>
      {lessons.map((lesson, i) => {
        const presence = presencePill(lesson.present);
        const homework = lesson.present === 'absent' ? null : homeworkPill(lesson.homework);
        const highlighted = highlightDate === lesson.date;
        return (
          <div
            key={lesson.date}
            id={`lesson-${lesson.date}`}
            className="transition-colors duration-500 ease-out"
            style={{ backgroundColor: highlighted ? 'hsl(var(--primary) / 0.08)' : 'transparent' }}>
            
            <ListRow
              last={i === lessons.length - 1}
              chevron
              onClick={() => {
                haptic('light');
                openSheet({
                  key: `lesson-${lesson.date}`,
                  detent: 'medium',
                  node: <LessonSheet lesson={lesson} group={group} />
                });
              }}
              label={
              <span className="tabular-nums">
                  {lesson.day} {shortDate(lesson.date)}
                </span>
              }
              secondary={<span className="tabular-nums">{lesson.time}</span>}
              below={
              <span className="mt-2 flex flex-wrap gap-2">
                  {presence && <StatusPill tone={presence.tone} label={presence.label} />}
                  {homework &&
                <StatusPill
                  tone={homework.tone}
                  label={
                  lesson.homework === 'done' ? t.hwDone : `${t.lessonHomework}: ${homework.label}`
                  } />

                }
                </span>
              } />
            
          </div>);

      })}
    </ListGroup>);

}

export function LessonSheet({ lesson, group }: {lesson: Lesson;group: string;}) {
  const { closeSheet } = useUI();
  const rows = [
  { label: t.lessonAttendance, pill: presencePill(lesson.present) },
  { label: t.lessonHomework, pill: homeworkPill(lesson.homework) },
  { label: t.lessonConspect, pill: conspectPill(lesson.conspect) },
  { label: t.lessonEngagement, pill: engagementPill(lesson.engagement) }].
  filter((r) => r.pill !== null);

  return (
    <Sheet
      title={longDate(lesson.date)}
      subtitle={`${lesson.time} · ${group}`}
      detent="medium"
      onClose={closeSheet}>
      
      <p className="px-4 pb-4 font-sans text-subhead text-mutedfg">{lesson.teacher}</p>
      <ListGroup>
        {rows.map((row, i) =>
        <ListRow
          key={row.label}
          last={i === rows.length - 1}
          label={<span className="font-normal">{row.label}</span>}
          trailing={<StatusPill tone={row.pill!.tone} label={row.pill!.label} />} />

        )}
      </ListGroup>
    </Sheet>);

}