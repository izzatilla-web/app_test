/**
 * Portal payloads from Phoenix-MS `/api/me/*`.
 *
 * Every field below was read off the running CRM (portal accounts 00032 /
 * 100032), not inferred. Source of truth: server/storage.ts `studentBundle`
 * and shared/routes.ts. Phoenix-MS decides what a family may see — a student
 * gets their own weak points, a parent never does; a parent gets the ledger,
 * a non-paying student does not.
 */

export interface PortalStudent {
  id: number;
  studentNo: number;
  firstName: string;
  lastName: string;
  /** pending | trial | active | paused | inactive */
  currentStatus: string;
  studentType: string;
  format: string;
  studentIsPayer: boolean;
  /** Enrolled level, e.g. "A3.2". */
  levelCode: string | null;
  currentLevelCode: string | null;
  groupName: string | null;
  teacherName: string | null;
  secondGroupName: string | null;
  secondTeacherName: string | null;
  attendanceRate: number | null;
  attendanceSessions: number;
  phone: string | null;
}

export interface PortalTopic {
  id: number;
  studentId: number;
  title: string;
  position: number;
  startDate: string;
  endDate: string;
  /** What the teacher recorded as finished; "" while nothing is logged. */
  completedTasks: string;
  completedTasksAt: string | null;
  taskStatus: string;
  /** Sent as a string by the CRM, "" when no exam was taken. */
  examScore: string;
  examStatus: string;
  overallStatus: string;
  expectedLessons: number;
  lessonsUsed: number;
  hiddenAt: string | null;
}

export interface PortalPaymentSplit {
  id: number;
  paymentId: number;
  /** cash | card | transfer … as recorded by the front desk. */
  method: string;
  amount: number;
}

export interface PortalPayment {
  id: number;
  chargeId: number;
  /** The day the money was taken (stored at midnight). */
  paidAt: string;
  /** When the front desk entered it — the only timestamp carrying an hour. */
  createdAt: string;
  note: string;
  splits: PortalPaymentSplit[];
  recordedByName: string | null;
  voidedAt: string | null;
  voidReason: string;
}

export interface PortalLedgerMonth {
  /** First day of the billed month, e.g. "2026-08-01". */
  periodMonth: string;
  amountDue: number;
  paid: number;
  balance: number;
  note: string;
  custom: boolean;
  writtenOff: boolean;
  cheque: boolean;
  payments: PortalPayment[];
}

export interface PortalGuardian {
  guardianId: number;
  name: string;
  phone: string;
  relation: string;
  isPayer: boolean;
  priority: number;
  userId: number | null;
  username: string | null;
}

/** Support session a family may see — the thinnest shape in the CRM by design. */
export interface PortalSession {
  date: string;
  slotLabel: string;
  attended: boolean;
  missed: boolean;
}

/** Students see what their support teacher left unfinished; parents never do. */
export interface PortalWeakPoint {
  id: number;
  studentId: number;
  topic: string;
  note: string;
  raisedAt: string;
  sessionsSince: number;
  closedAt: string | null;
  closedNote: string;
  raisedByName: string | null;
  nextBookedDate: string | null;
  nextBookedSlot: string | null;
}

/** One child's whole portal record — what `/api/me/student` returns, and one entry of `/api/me/children`. */
export interface PortalBundle {
  student: PortalStudent;
  topics: PortalTopic[];
  ledger: PortalLedgerMonth[];
  guardians: PortalGuardian[];
  sessions: PortalSession[];
  weakPoints: PortalWeakPoint[];
}

export interface PortalLesson {
  date: string;
  slotLabel: string;
  groupName: string;
  /** present | late | absent | … as marked on the register. */
  presentStatus: string;
  /** done | partial | not | "" — a status, not the assignment text. */
  homework: string;
  teacherName: string | null;
}

export interface PortalExam {
  attemptId: number;
  topicId: number;
  topicTitle: string;
  takenOn: string;
  score: number;
  /** pass | conditional | fail */
  result: string;
  comment: string;
  gradedByName: string | null;
  hasScan: boolean;
}
