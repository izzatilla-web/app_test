/**
 * Phoenix-MS portal shapes → the shapes the existing screens already render.
 *
 * The CRM stays the source of truth: nothing is invented here. Where the portal
 * endpoint does not carry a field (the notebook and engagement marks are staff
 * data and are deliberately not sent to families), the value is left empty and
 * the screen simply omits that row — see `conspectPill` / `engagementPill`,
 * which return null for "".
 */
import { t } from '../strings';
import type { AcademicLevelCode } from '../types/levelIdentity';
import type { Exam, LedgerMonth, Lesson, Payment, Presence, Homework, SupportSession } from '../mockData';
import type { PortalExam, PortalLedgerMonth, PortalLesson, PortalPayment, PortalSession, PortalStudent } from '../types/portal';

/** Phoenix-MS PresentStatus → the app's Presence. Every CRM value has its own. */
function toPresence(status: string): Presence {
  switch (status) {
    case 'present':
    case 'late':
    case 'absent':
    case 'never_arrived':
      return status;
    default:
      // The register row exists but carries no mark.
      return 'pending';
  }
}

/** Phoenix-MS WorkDone → the app's Homework. Same words on both sides. */
function toHomework(value: string): Homework {
  return value === 'done' || value === 'partial' || value === 'not' ? value : '';
}

/** Short weekday label for a yyyy-mm-dd date, in the active language. */
function weekdayLabel(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  // getDay(): 0 = Sunday. The app's weekday lists start at Monday.
  return t.weekdaysShort[(parsed.getDay() + 6) % 7] ?? '';
}

export function toAppLesson(lesson: PortalLesson): Lesson {
  return {
    date: lesson.date,
    day: weekdayLabel(lesson.date),
    time: lesson.slotLabel,
    present: toPresence(lesson.presentStatus),
    homework: toHomework(lesson.homework),
    // Not sent to families by Phoenix-MS — the rows stay hidden rather than guessed.
    conspect: '',
    engagement: '',
    teacher: lesson.teacherName ?? ''
  };
}

/**
 * Share of lessons whose homework was marked done. Phoenix-MS has no portal
 * field for this, so it is derived from the marks it does send; lessons with no
 * homework mark at all are left out of the denominator.
 */
export function homeworkRateOf(lessons: PortalLesson[]): number | null {
  const marked = lessons.filter((l) => toHomework(l.homework) !== '');
  if (marked.length === 0) return null;
  const done = marked.filter((l) => l.homework === 'done').length;
  return Math.round((done / marked.length) * 100);
}

/** Phoenix-MS PaymentMethod (cash | card | online) in the reader's language. */
function methodLabel(method: string): string {
  if (method === 'cash') return t.payMethodCash;
  if (method === 'card') return t.payMethodCard;
  if (method === 'online') return t.payMethodOnline;
  // An unknown method is shown as the CRM wrote it rather than dropped.
  return method;
}

/** "2026-08-01" → "Avgust 2026" in the active language. */
function monthLabelOf(periodMonth: string): string {
  const parsed = new Date(`${periodMonth}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return periodMonth;
  return `${t.monthsFull[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

/** Hour and minute of an ISO timestamp, as the receipt prints it. */
function clockOf(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
}

function toAppPayment(payment: PortalPayment): Payment {
  return {
    id: payment.id,
    date: payment.paidAt.slice(0, 10),
    // paidAt is a day; the hour lives on the row's creation stamp.
    time: clockOf(payment.createdAt),
    // Phoenix-MS stores the amount per split, so the receipt total is their sum.
    amount: payment.splits.reduce((sum, split) => sum + split.amount, 0),
    splits: payment.splits.map((split) => ({ method: methodLabel(split.method), amount: split.amount })),
    takenBy: payment.recordedByName ?? '',
    voided: payment.voidedAt !== null
  };
}

export function toAppLedgerMonth(month: PortalLedgerMonth): LedgerMonth {
  return {
    month: month.periodMonth,
    label: monthLabelOf(month.periodMonth),
    due: month.amountDue,
    paid: month.paid,
    balance: month.balance,
    cheque: month.cheque,
    writtenOff: month.writtenOff,
    payments: month.payments.map(toAppPayment)
  };
}

/** What this family still owes across every month the CRM billed. */
export function balanceOf(ledger: PortalLedgerMonth[]): number {
  return ledger.reduce((sum, month) => sum + month.balance, 0);
}

/**
 * A message to show for a failed phone save.
 *
 * Phoenix-MS answers in English; the format complaint is the one a family can
 * actually act on, so it is shown in their language. Anything else the server
 * says is passed through in its own words rather than guessed at.
 */
export function phoneErrorMessage(status: number, serverMessage: string): string {
  if (status === 0) return t.authErrNetwork;
  if (/phone number/i.test(serverMessage)) return t.phoneInvalid;
  return serverMessage || t.authErrGeneric;
}

/** Phoenix-MS exam sitting → the row the exams list renders. Field for field. */
export function toAppExam(exam: PortalExam): Exam {
  return {
    id: exam.attemptId,
    topic: exam.topicTitle,
    date: exam.takenOn,
    score: exam.score,
    // Phoenix-MS ExamResult: fail | conditional | pass — the app's own three.
    result: exam.result === 'pass' || exam.result === 'conditional' ? exam.result : 'fail',
    comment: exam.comment,
    gradedBy: exam.gradedByName ?? '',
    hasScan: exam.hasScan
  };
}

/**
 * Support session as a family may see it. Phoenix-MS sends the thinnest shape
 * in the codebase on purpose: the day, the hour, and whether the child turned
 * up — never the topic or the weak point behind it.
 */
export function toAppSupportSession(session: PortalSession): SupportSession {
  return {
    date: session.date,
    time: session.slotLabel,
    attended: session.attended,
    missed: session.missed
  };
}

/** The shape the Today screens render for the current day's lesson. */
export interface TodayLesson {
  has: boolean;
  time: string;
  group: string;
  teacher: string;
  status: Presence;
}

/**
 * Which weekdays a Phoenix-MS group meets, read off its name.
 * "MWF · 15:30 – 16:50" → Monday, Wednesday, Friday. "TTS" → Tue, Thu, Sat.
 * Returns null when the name carries no pattern we recognise.
 */
function meetingDaysOf(groupName: string | null): number[] | null {
  const head = (groupName ?? '').split('·')[0].trim().toUpperCase();
  if (head.startsWith('MWF')) return [1, 3, 5];
  if (head.startsWith('TTS')) return [2, 4, 6];
  return null;
}

/** The hour part of a group name, e.g. "15:30 – 16:50". */
function slotOf(groupName: string | null): string {
  const parts = (groupName ?? '').split('·');
  return parts.length > 1 ? parts.slice(1).join('·').trim() : '';
}

/**
 * Today's lesson, from what Phoenix-MS knows: the group's own timetable says
 * whether there is a lesson at all, and the register says how it went.
 *
 * A lesson that is scheduled but not yet marked is `pending` — not "no lesson".
 * The teacher marks the register during or after the lesson, so for most of the
 * day the honest answer is "there is a lesson, nobody has marked it yet".
 */
export function todayLessonOf(
student: PortalStudent,
lessons: PortalLesson[],
todayIso: string)
: TodayLesson {
  const marked = lessons.find((lesson) => lesson.date === todayIso);
  if (marked) {
    return {
      has: true,
      time: marked.slotLabel,
      group: marked.groupName,
      teacher: marked.teacherName ?? '',
      status: toPresence(marked.presentStatus)
    };
  }

  const days = meetingDaysOf(student.groupName);
  const weekday = new Date(`${todayIso}T00:00:00`).getDay();
  if (!days || !days.includes(weekday)) {
    return { has: false, time: '', group: '', teacher: '', status: 'none' };
  }

  return {
    has: true,
    time: slotOf(student.groupName),
    group: (student.groupName ?? '').split('·')[0].trim(),
    teacher: student.teacherName ?? '',
    status: 'pending'
  };
}

/**
 * Phoenix-MS rung → the app's visual level band.
 *
 * The CRM ladder has 21 rungs (A1.1 … A3.3, B1.1 … B3.3, C-SAT, C-DTM, C-MS);
 * the app's level identity — colours, monogram, motto — is drawn per band
 * (A1 … C3). A rung always belongs to exactly one band, so the sub-number is
 * dropped and the three C rungs map to the app's three C levels in order.
 * Returns null for anything unrecognised, so callers can fall back rather than
 * paint the wrong identity.
 */
export function appLevelOf(crmLevelCode: string | null): AcademicLevelCode | null {
  const code = (crmLevelCode ?? '').trim().toUpperCase();
  if (!code) return null;
  if (code === 'C-SAT') return 'C1';
  if (code === 'C-DTM') return 'C2';
  if (code === 'C-MS') return 'C3';
  const band = code.match(/^([AB][123])(?:\.\d+)?$/);
  if (band) return band[1] as AcademicLevelCode;
  return null;
}
