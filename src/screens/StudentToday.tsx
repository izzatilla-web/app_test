import React from 'react';
import {
  BellIcon,
  CalendarClockIcon,
  CalendarOffIcon,
  CheckCircle2Icon,
  FlagIcon,
  MessageCircleIcon,
  TrophyIcon } from
'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { NavIconButton } from '../components/NavBar';
import { ProfileChip } from '../components/ProfileChip';
import { AlertCard, Card } from '../components/Card';
import { StatTrio } from '../components/StatTrio';
import { StatusPill } from '../components/StatusPill';
import { ListGroup, ListRow } from '../components/List';
import { Button } from '../components/Button';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { GoalProgressDashboardCard } from '../components/GoalProgressDashboardCard';
import { Notifications } from './Notifications';
import { NewBookingSheet } from './NewBookingSheet';
import { Ranking } from './Ranking';
import { ChatList } from './ChatList';
import { t } from '../strings';
import { student, bookings, TODAY } from '../mockData';
import { longDate } from '../tokens';
import { examPill } from '../utils/status';
import { presencePill } from '../utils/status';
import { useChatUnread } from '../useChatUnread';
import { useUI } from '../ui';

export function StudentToday({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const chatUnread = useChatUnread();
  const empty = dataState === 'empty';
  const lesson = student.todayLesson;
  const presence = presencePill(lesson.status);
  const nextBooking = bookings.find((b) => b.status === 'booked' && !b.cancelledAt && b.date >= TODAY);
  const latestExam = student.exams[0];

  return (
    <ScrollScreen
      title={t.tabToday}
      subtitle={t.todayGreeting(student.firstName)}
      scrollKey="student-today"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      leading={
      <ProfileChip
        name={student.firstName}
        seed={student.id}
        caption={student.level}
        label={t.profileOpenLabel}
        onClick={() => ui.goToTab(6)} />

      }
      trailing={
      <>
          <NavIconButton
          label={t.rankingTitle}
          onClick={() =>
          ui.push({
            key: 'ranking',
            backTitle: t.tabToday,
            node: <Ranking child={student} backTitle={t.tabToday} />
          })
          }>

            <TrophyIcon size={21} />
          </NavIconButton>
          <NavIconButton
          label={t.notificationsTitle}
          badge={ui.unreadCount > 0}
          onClick={() =>
          ui.push({
            key: 'notifications',
            backTitle: t.tabToday,
            node: <Notifications backTitle={t.tabToday} />
          })
          }>

            <BellIcon size={21} />
          </NavIconButton>
          <NavIconButton
          label={t.chatTitle}
          badge={chatUnread > 0}
          onClick={() =>
          ui.push({
            key: 'chat',
            backTitle: t.tabToday,
            node: <ChatList backTitle={t.tabToday} />
          })
          }>

            <MessageCircleIcon size={21} />
          </NavIconButton>
        </>
      }>
      
      {dataState === 'loading' ?
      <ScreenSkeleton /> :
      dataState === 'error' ?
      <ErrorState onRetry={() => undefined} /> :

      <div className="space-y-4">
        <section className="px-4">
          <Card>
            {lesson.has && !empty ? (
              <>
                <p className="font-sans text-caption font-medium uppercase tracking-[0.4px] text-mutedfg">
                  {t.todayLessonCaption}
                </p>
                <p className="mt-1 font-display text-title1 font-bold tabular-nums text-foreground">
                  {lesson.time}
                </p>
                <p className="mt-1 font-sans text-subhead text-mutedfg">
                  {lesson.group} · {lesson.teacher}
                </p>
                {presence && (
                  <div className="mt-3">
                    <StatusPill tone={presence.tone} label={presence.label} />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={CalendarOffIcon}
                title={t.todayNoLesson}
                body={t.todayNextLesson}
                compact
              />
            )}
          </Card>
        </section>

        {/* ── Prominent Academic Goal & Lesson Count Progress Widget ── */}
        {!empty && (
          <section className="px-4">
            <GoalProgressDashboardCard />
          </section>
        )}

        {!empty && student.weakPoints.length > 0 ? (
          <section className="space-y-3 px-4">
            {student.weakPoints.map((wp) => (
              <AlertCard
                key={wp.id}
                tone="amber"
                icon={FlagIcon}
                title={wp.topic}
                body={t.weakPointBody}
                action={
                  <Button
                    variant="secondary"
                    full
                    onClick={() => {
                      ui.goToTab(4);
                      ui.openSheet({
                        key: 'new-booking',
                        detent: 'large',
                        node: (
                          <NewBookingSheet
                            initialPurpose={`${wp.topic} — ${wp.note.toLowerCase()}`}
                          />
                        )
                      });
                    }}
                  >
                    {t.weakPointCta}
                  </Button>
                }
              />
            ))}
          </section>
        ) : (
          <section className="px-4">
            <Card>
              <div className="flex items-start gap-3">
                <CheckCircle2Icon size={22} className="mt-[1px] shrink-0 text-good" />
                <div>
                  <h3 className="font-sans text-headline font-semibold text-foreground">
                    {t.todayAllClear}
                  </h3>
                  <p className="mt-[2px] font-sans text-subhead text-mutedfg">
                    {t.todayAllClearBody}
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        <StatTrio
          items={[
            { value: `${student.attendanceRate}%`, label: t.statAttendance },
            { value: `${student.homeworkRate}%`, label: t.statHomework },
            { value: `${student.topicsDone}/${student.topicsTotal}`, label: t.statTopics }
          ]}
        />
        

          {nextBooking && !empty &&
        <ListGroup header={t.nextBookingHeader}>
              <ListRow
            last
            icon={CalendarClockIcon}
            label={longDate(nextBooking.date)}
            value={<span className="tabular-nums">{nextBooking.time}</span>}
            chevron
            onClick={() => ui.goToTab(4)} />
          
            </ListGroup>
        }

          {latestExam && !empty &&
        <ListGroup header={t.lastExamHeader}>
              <ListRow
            last
            label={latestExam.topic}
            value={
            <span className="font-display text-title3 font-semibold text-foreground">
                    {latestExam.score}
                  </span>
            }
            trailing={
            <StatusPill
              tone={examPill(latestExam.result).tone}
              label={examPill(latestExam.result).label} />

            }
            chevron
            onClick={() => ui.goToTab(5)} />
          
            </ListGroup>
        }
        </div>
      }
    </ScrollScreen>);

}