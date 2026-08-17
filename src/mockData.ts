import { curriculumFor, masteredCount, topicCount } from './curriculum';

export type Presence = 'present' | 'late' | 'absent' | 'pending' | 'none';
export type Homework = 'done' | 'partial' | 'not' | '';
export type Conspect = 'full' | 'partial' | '';
export type Engagement = 'high' | 'medium' | 'low' | '';

export interface Lesson {
  date: string;
  day: string;
  time: string;
  present: Presence;
  homework: Homework;
  conspect: Conspect;
  engagement: Engagement;
  teacher: string;
}

export interface Topic {
  id: number;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  examScore: number | null;
}

export interface Exam {
  id: number;
  topic: string;
  date: string;
  score: number;
  result: 'pass' | 'conditional' | 'fail';
  comment: string;
  gradedBy: string;
  hasScan: boolean;
}

export interface Booking {
  id: number | string;
  studentId?: number;
  date: string;
  day?: string;
  time: string;
  timeSlotId?: string;
  purpose: string;
  status: 'booked' | 'attended' | 'cancelled' | 'missed';
  cancelledAt?: string | null;
  cancelReason?: string | null;
  teacherNote?: string;
  workedOn?: string | null;
  result?: 'pass' | 'conditional' | 'fail' | null;
  resultNote?: string | null;
  needsAnother?: boolean;
  locked?: boolean;
  slotLabel?: string;
  teacherName?: string;
  room?: string;
}

export interface WeakPoint {
  id: number;
  topic: string;
  note: string;
}

export interface Split {
  method: string;
  amount: number;
}

export interface Payment {
  id: number;
  date: string;
  time: string;
  amount: number;
  splits: Split[];
  takenBy: string;
  voided: boolean;
}

export interface LedgerMonth {
  month: string;
  label: string;
  due: number;
  paid: number;
  balance: number;
  cheque: boolean;
  writtenOff: boolean;
  payments: Payment[];
}

export interface SupportSession {
  date: string;
  time: string;
  attended: boolean;
}

export interface ChildRecord {
  id: number;
  studentNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  level: string;
  group: string;
  status: string;
  teacher: string;
  attendanceRate: number;
  homeworkRate: number;
  topicsDone: number;
  topicsTotal: number;
  lessonCount: number;
  todayLesson: {has: boolean;time: string;group: string;teacher: string;status: Presence;};
  lessons: Lesson[];
  topics: Topic[];
  exams: Exam[];
  weakPoints: WeakPoint[];
  ledger: LedgerMonth[];
  supportSessions: SupportSession[];
}

export const TODAY = '2026-08-12';

export const parent = {
  username: '001234',
  name: 'Nodira Valiyeva',
  firstName: 'Nodira',
  phone: '+998 90 111 22 33'
};

const aliLessons: Lesson[] = [
{ date: '2026-08-12', day: 'Sesh', time: '14:00–15:20', present: 'present', homework: 'done', conspect: 'full', engagement: 'high', teacher: 'Nodira Karimova' },
{ date: '2026-08-11', day: 'Dush', time: '14:00–15:20', present: 'late', homework: 'not', conspect: 'partial', engagement: 'medium', teacher: 'Nodira Karimova' },
{ date: '2026-08-08', day: 'Juma', time: '14:00–15:20', present: 'absent', homework: '', conspect: '', engagement: '', teacher: 'Nodira Karimova' },
{ date: '2026-08-07', day: 'Pay', time: '14:00–15:20', present: 'present', homework: 'partial', conspect: 'full', engagement: 'high', teacher: 'Nodira Karimova' },
{ date: '2026-08-06', day: 'Chor', time: '14:00–15:20', present: 'present', homework: 'done', conspect: 'full', engagement: 'medium', teacher: 'Nodira Karimova' },
{ date: '2026-08-05', day: 'Sesh', time: '14:00–15:20', present: 'present', homework: 'done', conspect: 'partial', engagement: 'high', teacher: 'Nodira Karimova' },
{ date: '2026-08-04', day: 'Dush', time: '14:00–15:20', present: 'present', homework: 'done', conspect: 'full', engagement: 'high', teacher: 'Nodira Karimova' },
{ date: '2026-08-01', day: 'Juma', time: '14:00–15:20', present: 'late', homework: 'partial', conspect: 'partial', engagement: 'medium', teacher: 'Nodira Karimova' }];


const layloLessons: Lesson[] = [
{ date: '2026-08-12', day: 'Sesh', time: '17:00–18:20', present: 'pending', homework: '', conspect: '', engagement: '', teacher: 'Sardor Rahimov' },
{ date: '2026-08-11', day: 'Dush', time: '17:00–18:20', present: 'present', homework: 'done', conspect: 'full', engagement: 'high', teacher: 'Sardor Rahimov' },
{ date: '2026-08-08', day: 'Juma', time: '17:00–18:20', present: 'present', homework: 'done', conspect: 'full', engagement: 'high', teacher: 'Sardor Rahimov' },
{ date: '2026-08-07', day: 'Pay', time: '17:00–18:20', present: 'late', homework: 'partial', conspect: 'partial', engagement: 'medium', teacher: 'Sardor Rahimov' },
{ date: '2026-08-06', day: 'Chor', time: '17:00–18:20', present: 'present', homework: 'done', conspect: 'full', engagement: 'high', teacher: 'Sardor Rahimov' },
{ date: '2026-08-05', day: 'Sesh', time: '17:00–18:20', present: 'present', homework: 'not', conspect: 'full', engagement: 'medium', teacher: 'Sardor Rahimov' }];


const ali: ChildRecord = {
  id: 1,
  studentNo: '01234',
  firstName: 'Ali',
  lastName: 'Valiyev',
  phone: '+998 90 123 45 67',
  level: 'A2',
  group: 'A2-ertalab',
  status: 'Faol',
  teacher: 'Nodira Karimova',
  attendanceRate: 92,
  homeworkRate: 78,
  // Derived from the curriculum — progress is never stored in two places.
  topicsDone: masteredCount(curriculumFor(1)),
  topicsTotal: topicCount(curriculumFor(1)),
  lessonCount: 24,
  todayLesson: {
    has: true,
    time: '14:00 – 15:20',
    group: 'A2-ertalab',
    teacher: 'Nodira Karimova',
    status: 'present'
  },
  lessons: aliLessons,
  topics: [
  { id: 1, title: 'Butun sonlar', status: 'completed', examScore: 85 },
  { id: 2, title: 'Kasrlar', status: 'in_progress', examScore: null },
  { id: 3, title: "O'nli kasrlar", status: 'completed', examScore: 72 },
  { id: 4, title: 'Foizlar', status: 'not_started', examScore: null },
  { id: 5, title: 'Nisbat va proporsiya', status: 'not_started', examScore: null }],

  exams: [
  {
    id: 1,
    topic: 'Butun sonlar',
    date: '2026-08-05',
    score: 85,
    result: 'pass',
    comment: "Ishonchli yechdi, faqat 4-misolda shoshildi.",
    gradedBy: 'Nodira Karimova',
    hasScan: true
  },
  {
    id: 2,
    topic: "O'nli kasrlar",
    date: '2026-07-22',
    score: 72,
    result: 'conditional',
    comment:
    "Asosini tushunadi, lekin vergul o'rnida xato qiladi. Yana mashq kerak.",
    gradedBy: 'Nodira Karimova',
    hasScan: true
  },
  {
    id: 3,
    topic: 'Kasrlar',
    date: '2026-07-08',
    score: 48,
    result: 'fail',
    comment: "Maxrajni tenglash qismini qaytadan o'tish kerak.",
    gradedBy: 'Sardor Rahimov',
    hasScan: false
  }],

  weakPoints: [{ id: 1, topic: 'Kasrlar', note: "Maxrajni tenglashda qiynaldi" }],
  ledger: [
  {
    month: '2026-08',
    label: 'Avgust 2026',
    due: 600000,
    paid: 450000,
    balance: 150000,
    cheque: false,
    writtenOff: false,
    payments: [
    { id: 1042, date: '2026-08-05', time: '14:32', amount: 300000, splits: [{ method: 'Naqd', amount: 300000 }], takenBy: 'Nodira Nazarova', voided: false },
    { id: 1067, date: '2026-08-12', time: '10:15', amount: 150000, splits: [{ method: 'Karta', amount: 150000 }], takenBy: 'Nodira Nazarova', voided: false },
    { id: 1031, date: '2026-08-03', time: '09:40', amount: 100000, splits: [{ method: 'Naqd', amount: 100000 }], takenBy: 'Nodira Nazarova', voided: true }]

  },
  {
    month: '2026-07',
    label: 'Iyul 2026',
    due: 600000,
    paid: 600000,
    balance: 0,
    cheque: true,
    writtenOff: false,
    payments: [
    {
      id: 987,
      date: '2026-07-04',
      time: '11:20',
      amount: 600000,
      splits: [
      { method: 'Naqd', amount: 400000 },
      { method: 'Karta', amount: 200000 }],

      takenBy: 'Dilshod Umarov',
      voided: false
    }]

  },
  { month: '2026-06', label: 'Iyun 2026', due: 600000, paid: 600000, balance: 0, cheque: true, writtenOff: false, payments: [] },
  { month: '2026-05', label: 'May 2026', due: 600000, paid: 0, balance: 0, cheque: false, writtenOff: true, payments: [] }],

  supportSessions: [
  { date: '2026-08-06', time: '14:00–15:20', attended: true },
  { date: '2026-07-30', time: '16:00–17:20', attended: false }]

};

const laylo: ChildRecord = {
  id: 2,
  studentNo: '01567',
  firstName: 'Laylo',
  lastName: 'Valiyeva',
  phone: '+998 90 123 45 67',
  level: 'B1',
  group: 'B1-kechki',
  status: 'Faol',
  teacher: 'Sardor Rahimov',
  attendanceRate: 97,
  homeworkRate: 91,
  topicsDone: masteredCount(curriculumFor(2)),
  topicsTotal: topicCount(curriculumFor(2)),
  lessonCount: 22,
  todayLesson: {
    has: true,
    time: '17:00 – 18:20',
    group: 'B1-kechki',
    teacher: 'Sardor Rahimov',
    status: 'pending'
  },
  lessons: layloLessons,
  topics: [
  { id: 1, title: 'Kvadrat tenglamalar', status: 'completed', examScore: 94 },
  { id: 2, title: 'Funksiyalar', status: 'completed', examScore: 88 },
  { id: 3, title: 'Grafiklar', status: 'in_progress', examScore: null },
  { id: 4, title: 'Progressiyalar', status: 'not_started', examScore: null }],

  exams: [
  {
    id: 11,
    topic: 'Funksiyalar',
    date: '2026-08-07',
    score: 88,
    result: 'pass',
    comment: "Grafikni to'g'ri qurdi va izohladi. Yozuvi biroz shoshqaloq.",
    gradedBy: 'Sardor Rahimov',
    hasScan: true
  },
  {
    id: 12,
    topic: 'Kvadrat tenglamalar',
    date: '2026-07-18',
    score: 94,
    result: 'pass',
    comment: "Diskriminant orqali ham, Viet teoremasi orqali ham yecha oldi.",
    gradedBy: 'Sardor Rahimov',
    hasScan: false
  }],

  weakPoints: [],
  ledger: [
  {
    month: '2026-08',
    label: 'Avgust 2026',
    due: 650000,
    paid: 400000,
    balance: 250000,
    cheque: false,
    writtenOff: false,
    payments: [
    { id: 1051, date: '2026-08-06', time: '12:05', amount: 400000, splits: [{ method: 'Karta', amount: 400000 }], takenBy: 'Dilshod Umarov', voided: false }]

  },
  {
    month: '2026-07',
    label: 'Iyul 2026',
    due: 650000,
    paid: 650000,
    balance: 0,
    cheque: true,
    writtenOff: false,
    payments: [
    { id: 991, date: '2026-07-05', time: '10:02', amount: 650000, splits: [{ method: 'Naqd', amount: 650000 }], takenBy: 'Nodira Nazarova', voided: false }]

  }],

  supportSessions: [{ date: '2026-08-04', time: '17:00–18:20', attended: true }]
};

export const children: ChildRecord[] = [ali, laylo];

export const student = ali;

export function childById(id: number): ChildRecord {
  return children.find((c) => c.id === id) ?? ali;
}

export const familyBalance = children.reduce(
  (sum, c) => sum + c.ledger.reduce((s, m) => s + m.balance, 0),
  0
);

export function childBalance(child: ChildRecord): number {
  return child.ledger.reduce((s, m) => s + m.balance, 0);
}

export function currentDebtMonth(child: ChildRecord): LedgerMonth | undefined {
  return child.ledger.find((m) => m.balance > 0);
}

export const bookings: Booking[] = [
{ id: 1, date: '2026-08-14', day: 'Pay', time: '16:00–17:20', purpose: "Kasrlar — maxrajni tenglash", status: 'booked' },
{ id: 4, date: '2026-08-12', day: 'Sesh', time: '18:00–19:20', purpose: 'Foizlar — takrorlash', status: 'booked', locked: true },
{
  id: 2,
  date: '2026-08-08',
  day: 'Juma',
  time: '16:00–17:20',
  purpose: 'Uy vazifasi yordami',
  status: 'attended',
  teacherNote: "Kasrlar, 3–9 misollar ustida ishladik.",
  needsAnother: true
},
{
  id: 3,
  date: '2026-08-01',
  day: 'Juma',
  time: '14:00–15:20',
  purpose: 'Imtihonga tayyorgarlik',
  status: 'cancelled',
  cancelReason: "Kasal bo'lib qoldim"
}];


export const weeklyLimit = { used: 1, limit: 3 };

export const slots = [
{ id: 1, label: '14:00–15:20', taken: 5, capacity: 8 },
{ id: 2, label: '15:30–16:50', taken: 8, capacity: 8 },
{ id: 3, label: '16:00–17:20', taken: 2, capacity: 8 },
{ id: 4, label: '17:30–18:50', taken: 0, capacity: 8 }];


export interface NotificationItem {
  id: number;
  unread: boolean;
  icon: 'UserX' | 'Wallet' | 'FileCheck2' | 'Clock';
  tone: 'red' | 'green' | 'amber' | 'grey';
  title: string;
  body: string;
  time: string;
}

export const notifications: NotificationItem[] = [
{ id: 1, unread: true, icon: 'UserX', tone: 'red', title: 'Ali darsga kelmadi', body: '8-avgust, 14:00 dagi A2-ertalab guruhi darsi.', time: '2 soat oldin' },
{ id: 2, unread: true, icon: 'Wallet', tone: 'green', title: "To'lov qabul qilindi", body: "150 000 so'm · Karta · Avgust 2026", time: 'Kecha' },
{ id: 3, unread: false, icon: 'FileCheck2', tone: 'green', title: 'Imtihon baholandi', body: "Butun sonlar — 85 ball. O'tdi.", time: '5 avgust' },
{ id: 4, unread: false, icon: 'Clock', tone: 'amber', title: "To'lov muddati yaqinlashdi", body: "Avgust oyi uchun 150 000 so'm kutilmoqda.", time: '3 avgust' }];


export const SCAN_URL = "/a99f2ef4-d4dd-4c6e-bc86-cc357c4f841c.jpg";