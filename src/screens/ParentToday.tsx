import React from 'react';
import {
  BellIcon,
  CalendarOffIcon,
  CheckCircle2Icon,
  ClockIcon,
  HelpCircleIcon,
  WalletIcon,
  XCircleIcon } from
'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { NavIconButton } from '../components/NavBar';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { AlertCard, Card } from '../components/Card';
import { StatTrio } from '../components/StatTrio';
import { StatusPill } from '../components/StatusPill';
import { ListGroup, ListRow } from '../components/List';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { SupportSection } from '../components/ProgressSections';
import { Notifications } from './Notifications';
import { t } from '../strings';
import { formatSum, toneBg, toneFg } from '../tokens';
import { examPill } from '../utils/status';
import { TODAY, parent } from '../mockData';
import { firstNameOf } from '../types/phoenixUser';
import { usePortalLessons } from '../usePortalLessons';
import { usePortalExams } from '../usePortalExams';
import { balanceOf, homeworkRateOf, toAppExam, toAppLedgerMonth, toAppSupportSession, todayLessonOf } from '../services/portalAdapters';
import { getTashkentTodayIso } from '../utils/tashkentTime';
import { useUI } from '../ui';

export function ParentToday({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const empty = dataState === 'empty';
  const child = ui.activeChild;
  const siblings = ui.portalChildren ?? [];
  const register = usePortalLessons(child?.student.id);
  const examRows = usePortalExams(child?.student.id);

  const todayIso = getTashkentTodayIso() || TODAY;
  const lesson = child ?
  todayLessonOf(child.student, register.lessons, todayIso) :
  { has: false, time: '', group: '', teacher: '', status: 'none' as const };

  /* Money: Phoenix-MS bills per child; the family line adds every child up. */
  const balance = child ? balanceOf(child.ledger) : 0;
  const familyBalance = siblings.reduce((sum, c) => sum + balanceOf(c.ledger), 0);
  const debtMonth = child ?
  child.ledger.map(toAppLedgerMonth).find((month) => month.balance > 0) :
  undefined;

  const latestExam = examRows.exams.length > 0 ? toAppExam(examRows.exams[0]) : undefined;
  const homeworkRate = homeworkRateOf(register.lessons);
  const topicsDone = child ? child.topics.filter((tp) => tp.overallStatus === 'completed').length : 0;
  const topicsTotal = child ? child.topics.length : 0;
  const switcherChildren = siblings.map((c) => ({ id: c.student.id, firstName: c.student.firstName }));

  const childName = child?.student.firstName ?? '';

  const statusMeta = {
    present: { icon: CheckCircle2Icon, tone: 'green' as const, title: t.parentPresent(childName) },
    late: { icon: ClockIcon, tone: 'amber' as const, title: t.parentLate(childName) },
    absent: { icon: XCircleIcon, tone: 'red' as const, title: t.parentAbsent(childName) },
    /* Phoenix-MS keeps "never arrived" apart from "absent" — see the Presence type. */
    never_arrived: { icon: CalendarOffIcon, tone: 'grey' as const, title: t.parentNeverArrived(childName) },
    pending: { icon: HelpCircleIcon, tone: 'grey' as const, title: t.parentUnmarked(childName) },
    none: { icon: CalendarOffIcon, tone: 'grey' as const, title: t.todayNoLesson }
  }[lesson.status];

  const StatusIcon = statusMeta.icon;

  return (
    <ScrollScreen
      title={t.tabToday}
      subtitle={t.todayGreeting(firstNameOf(ui.user))}
      scrollKey="parent-today"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
      <ChildSwitcher children={switcherChildren} activeId={ui.activeChildId} onSelect={ui.setActiveChildId} />
      }
      trailing={
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
        
          <BellIcon size={22} />
        </NavIconButton>
      }>
      
      {dataState === 'loading' || register.loading || examRows.loading ?
      <ScreenSkeleton /> :
      dataState === 'error' || !child ?
      <ErrorState onRetry={ui.reloadPortal} /> :
      register.error || examRows.error ?
      <ErrorState onRetry={() => {register.reload();examRows.reload();}} /> :

      <div className="space-y-8">
          <section className="px-4">
            <Card>
              {lesson.has && !empty ?
            <div className="flex items-start gap-4">
                  <span
                className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: toneBg(statusMeta.tone) }}>
                
                    <StatusIcon size={26} style={{ color: toneFg(statusMeta.tone) }} />
                  </span>
                  <div className="min-w-0 pt-[2px]">
                    <h2 className="font-display text-title2 font-semibold text-foreground">
                      {statusMeta.title}
                    </h2>
                    <p className="mt-1 font-sans text-subhead tabular-nums text-mutedfg">
                      {lesson.time.split('–')[0].trim()} · {lesson.group} · {lesson.teacher}
                    </p>
                  </div>
                </div> :

            <EmptyState
              icon={CalendarOffIcon}
              title={t.todayNoLesson}
              body={t.todayNextLesson}
              compact />

            }
            </Card>
          </section>

          <section className="px-4">
            {balance > 0 && !empty ?
          <AlertCard
            tone="red"
            icon={WalletIcon}
            title={t.debtTitle(formatSum(balance))}
            action={
            <Button variant="secondary" full onClick={() => ui.goToTab(3)}>
                    {t.debtCta}
                  </Button>
            }>
            
                <p className="mt-1 font-sans text-subhead text-foreground/80">
                  {debtMonth?.label}
                </p>
                {familyBalance > balance &&
            <p className="mt-2 font-sans text-footnote tabular-nums text-foreground/70">
                    {t.debtAllChildren(formatSum(familyBalance))}
                  </p>
            }
              </AlertCard> :

          <Card>
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon size={22} className="shrink-0 text-good" />
                  <span className="font-sans text-headline font-semibold text-foreground">
                    {t.allPaid}
                  </span>
                </div>
              </Card>
          }
          </section>

          <StatTrio
          items={[
          { value: `${child?.student.attendanceRate ?? 0}%`, label: t.statAttendance },
          { value: homeworkRate !== null ? `${homeworkRate}%` : '—', label: t.statHomework },
          { value: `${topicsDone}/${topicsTotal}`, label: t.statTopics }]
          } />
        

          {!empty && child && <SupportSection sessions={child.sessions.map(toAppSupportSession)} />}

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
            onClick={() => ui.goToTab(4)} />
          
            </ListGroup>
        }
        </div>
      }
    </ScrollScreen>);

}