/**
 * Bilim Pasporti (Academic Passport) & Forecast Engine
 *
 * Implements the 6-number Academic Forecast model:
 * 1. Maqsad (Goal)
 * 2. Hozir qayerda (Current Rung/Position)
 * 3. Qolgan yo'l (Remaining Journey: rungs, topics, lessons)
 * 4. Sur'at (Pace: lessons/week × effective attendance)
 * 5. Prognoz (Forecast date based on pace + holidays)
 * 6. Hukm (Verdict: on_track, tight, behind)
 *
 * Plus Delay Causes (A/B/C) and What-If conditional forecasts for parents.
 */

import type { ChildRecord } from './mockData';
import { TODAY } from './mockData';
import { curriculumFor } from './curriculum';
import { currentPosition } from './access';
import { resolveLevelMeta } from './types/levelIdentity';
import { t } from './strings';

export type ForecastVerdict = 'on_track' | 'tight' | 'behind';

export interface AcademicGoal {
  title: string;
  kind: 'institute' | 'dtm' | 'sat' | 'maktab' | 'own';
  targetDate: string; // ISO date e.g. "2027-06-20"
  targetDateFormatted: string;
  requiredLevelCode: string;
  requiredLevelTitle: string;
  minScore?: number;
}

export interface PassportNow {
  levelCode: string;
  levelTitle: string;
  levelSequence: number;
  totalLevels: number;
  topicsDone: number;
  topicsTotal: number;
  percent: number;
}

export interface PassportRemaining {
  levels: number;
  topics: number;
  lessons: number;
}

export interface PassportPace {
  lessonsPerWeek: number;
  attendanceRate: number;
  effectiveLessonsPerWeek: number;
}

export interface PassportForecast {
  targetDate: string;
  targetDateFormatted: string;
  forecastDate: string;
  forecastDateFormatted: string;
  weeks: number;
  verdict: ForecastVerdict;
  deltaMonths: number;
  deltaDays: number;
  verdictText: string;
  verdictSummary: string;
}

export interface PassportCauses {
  planWeeks: number;
  planMonths: number;
  attendanceWeeks: number;
  attendanceMonths: number;
  overrunWeeks: number;
  overrunLessons: number;
}

export interface PassportSignal {
  code: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8';
  severity: 'good' | 'warn' | 'alert';
  title: string;
  studentText: string;
  parentText: string;
  actionLabel?: string;
}

export interface RungLadderStep {
  sequence: number;
  code: string;
  title: string;
  state: 'completed' | 'current' | 'future' | 'goal';
}

export interface AcademicPassport {
  goal: AcademicGoal;
  now: PassportNow;
  remaining: PassportRemaining;
  pace: PassportPace;
  forecast: PassportForecast;
  causes: PassportCauses;
  signals: PassportSignal[];
  ladder: RungLadderStep[];
  avgScore: number;
  totalLessonsAttended: number;
}

/** 21 Standard Rungs/Levels of Phoenix Math System */
export const PHOENIX_RUNGS = [
  { sequence: 1, code: 'A1.1', title: 'Butun sonlar' },
  { sequence: 2, code: 'A1.2', title: 'Oddiy kasrlar' },
  { sequence: 3, code: 'A1.3', title: 'O‘nli kasrlar' },
  { sequence: 4, code: 'A2.1', title: 'Foizlar va proporsiya' },
  { sequence: 5, code: 'A2.2', title: 'Nisbat va taqsimot' },
  { sequence: 6, code: 'A2.3', title: 'Amaliy hisob' },
  { sequence: 7, code: 'A3.1', title: 'Chiziqli ifodalar' },
  { sequence: 8, code: 'A3.2', title: 'Tenglamalar' },
  { sequence: 9, code: 'A3.3', title: 'Ko‘phadlar' },
  { sequence: 10, code: 'B1.1', title: 'Kvadrat tenglamalar' },
  { sequence: 11, code: 'B1.2', title: 'Tengsizliklar' },
  { sequence: 12, code: 'B1.3', title: 'Funksiyalar' },
  { sequence: 13, code: 'B2.1', title: 'Koordinatalar' },
  { sequence: 14, code: 'B2.2', title: 'Grafik tahlili' },
  { sequence: 15, code: 'B2.3', title: 'Planimetriya' },
  { sequence: 16, code: 'B3.1', title: 'Arifmetik progressiya' },
  { sequence: 17, code: 'B3.2', title: 'Geometrik progressiya' },
  { sequence: 18, code: 'B3.3', title: 'Stereometriya' },
  { sequence: 19, code: 'C-SAT', title: 'SAT Math' },
  { sequence: 20, code: 'C-DTM', title: 'DTM Tayyorgarlik' },
  { sequence: 21, code: 'C-MS', title: 'Milliy Sertifikat' }
];

/**
 * Calculates complete Academic Passport & Forecast based on the student's real curriculum,
 * attendance records, exam scores, and target goal.
 */
export function calculatePassport(child: ChildRecord): AcademicPassport {
  const levels = curriculumFor(child.id);
  const position = currentPosition(levels);

  // 1. Goal Configuration
  const goal: AcademicGoal = {
    title: 'TATU — Kompyuter injiniringi',
    kind: 'institute',
    targetDate: '2027-06-20',
    targetDateFormatted: '2027-iyun',
    requiredLevelCode: 'C-DTM',
    requiredLevelTitle: 'DTM Tayyorgarlik',
    minScore: 90
  };

  // 2. Current position + goal scope.
  // Every number below counts only the main path up to the goal level
  // (A1 → C-DTM). The E (geometry) track is elective and parallel, so it
  // never inflates the road to the goal.
  const goalSequence = resolveLevelMeta(goal.requiredLevelCode).sequence;
  const scopedTopics = levels
    .filter((level) => resolveLevelMeta(level.code).sequence <= goalSequence)
    .flatMap((level) => level.modules.flatMap((module) => module.topics));
  const topicsDone = scopedTopics.filter((topic) => topic.studied).length;
  const topicsTotal = scopedTopics.length;
  const percent = topicsTotal > 0 ? Math.round((topicsDone / topicsTotal) * 100) : 0;

  const totalRungs = PHOENIX_RUNGS.length;
  const currentRung = PHOENIX_RUNGS.find((rung) => rung.code === position?.module.code);
  const currentRungSeq = currentRung?.sequence ?? 1;
  const currentRungCode = position?.module.code || PHOENIX_RUNGS[0].code;
  const currentRungTitle = position?.module.title || PHOENIX_RUNGS[0].title;

  const now: PassportNow = {
    levelCode: currentRungCode,
    levelTitle: currentRungTitle,
    levelSequence: currentRungSeq,
    totalLevels: totalRungs,
    topicsDone,
    topicsTotal,
    percent
  };

  // 3. Remaining journey — the centre's real planned lesson count per open
  // topic, never a per-topic average.
  const remainingTopicsList = scopedTopics.filter((topic) => !topic.studied);
  const remainingLessons = remainingTopicsList.reduce((sum, topic) => sum + topic.lessons, 0);

  const remaining: PassportRemaining = {
    levels: Math.max(0, totalRungs - currentRungSeq),
    topics: remainingTopicsList.length,
    lessons: remainingLessons
  };

  // 4. Pace & Effective Speed (real attendance record)
  const lessonsPerWeek = 3; // Standard MWF/TTS schedule
  const attendedCount = child.lessons.filter((l) => l.present === 'present' || l.present === 'late').length;
  const rawAttendance = child.lessons.length > 0
    ? Math.round((attendedCount / child.lessons.length) * 100)
    : 72;
  const attendanceRate = rawAttendance > 0 ? rawAttendance : 72;

  // 40% floor to prevent infinity
  const effectivePace = Math.max(attendanceRate, 40) / 100;
  const effectiveLessonsPerWeek = Math.round(lessonsPerWeek * effectivePace * 100) / 100;

  const pace: PassportPace = {
    lessonsPerWeek,
    attendanceRate,
    effectiveLessonsPerWeek
  };

  // 5. Forecast — computed from today's real state, never hardcoded.
  // One question, one answer: with the current pace, when does the student
  // arrive? weeks = remaining lessons / effective lessons per week.
  const neededWeeks = Math.ceil(remainingLessons / (lessonsPerWeek * effectivePace));
  const planOnlyWeeks = Math.ceil(remainingLessons / lessonsPerWeek);
  const attendancePenaltyWeeks = Math.max(0, neededWeeks - planOnlyWeeks);

  const forecastDay = new Date(`${TODAY}T00:00:00`);
  forecastDay.setDate(forecastDay.getDate() + neededWeeks * 7);
  const forecastDate = [
    forecastDay.getFullYear(),
    String(forecastDay.getMonth() + 1).padStart(2, '0'),
    String(forecastDay.getDate()).padStart(2, '0')
  ].join('-');
  const forecastDateFormatted = `${forecastDay.getFullYear()}-${t.monthsGen[forecastDay.getMonth()]}`;

  const targetDay = new Date(`${goal.targetDate}T00:00:00`);
  const deltaDays = Math.round((targetDay.getTime() - forecastDay.getTime()) / 86400000);
  const deltaMonths = Math.round(deltaDays / 30.44);
  const lateMonths = Math.max(1, Math.abs(deltaMonths));

  let verdict: ForecastVerdict = 'behind';
  let verdictText = `${lateMonths} oy kech`;
  let verdictSummary = `Shu sur'atda o‘qish rejadagidan ${lateMonths} oy kech yakunlanadi`;

  if (deltaDays >= 30) {
    verdict = 'on_track';
    verdictText = 'Ulgurasiz';
    verdictSummary = 'Maqsad sari jadval bo‘yicha ketmoqdasiz';
  } else if (deltaDays >= 0) {
    verdict = 'tight';
    verdictText = 'Chegarada';
    verdictSummary = 'Vaqt tig‘iz, dars qoldirmaslik zarur';
  }

  const forecast: PassportForecast = {
    targetDate: goal.targetDate,
    targetDateFormatted: goal.targetDateFormatted,
    forecastDate,
    forecastDateFormatted,
    weeks: neededWeeks,
    verdict,
    deltaMonths,
    deltaDays,
    verdictText,
    verdictSummary
  };

  // 6. Causes Breakdown — plan and attendance are real; the topic-overrun
  // figures stay a documented centre estimate until the CRM exposes them.
  const causes: PassportCauses = {
    planWeeks: planOnlyWeeks,
    planMonths: Math.round((planOnlyWeeks / 4.33) * 10) / 10,
    attendanceWeeks: attendancePenaltyWeeks,
    attendanceMonths: Math.round((attendancePenaltyWeeks / 4.33) * 10) / 10,
    overrunWeeks: 4,
    overrunLessons: 11
  };

  // 8. Academic Ladder (21 Rungs)
  const ladder: RungLadderStep[] = PHOENIX_RUNGS.map((rung) => {
    let state: RungLadderStep['state'] = 'future';
    if (rung.sequence < currentRungSeq) {
      state = 'completed';
    } else if (rung.sequence === currentRungSeq) {
      state = 'current';
    } else if (rung.code === goal.requiredLevelCode) {
      state = 'goal';
    }
    return {
      sequence: rung.sequence,
      code: rung.code,
      title: rung.title,
      state
    };
  });

  // 9. Exam Average
  const exams = child.exams || [];
  const avgScore = exams.length > 0
    ? Math.round(exams.reduce((acc, ex) => acc + (ex.score || 0), 0) / exams.length)
    : 68;

  // 10. Rule-based Signals (P1..P8)
  const signals: PassportSignal[] = [];

  // P1: Behind schedule
  if (verdict === 'behind') {
    signals.push({
      code: 'P1',
      severity: 'alert',
      title: 'Kechikish xavfi',
      studentText: `Shu sur‘atda maqsadga ${lateMonths} oy kech yetasan. Davomatingni oshir!`,
      parentText: `Shu sur‘atda maqsadga ${lateMonths} oy kech qoladi. Asosiy sabab — dars qoldirilishi.`
    });
  }

  // P2: Attendance < 90%
  if (attendanceRate < 90 && attendancePenaltyWeeks > 0) {
    signals.push({
      code: 'P2',
      severity: 'warn',
      title: 'Davomat ko‘rsatkichi',
      studentText: `Davomating ${attendanceRate}% — kelmagan darslar rejangga ${attendancePenaltyWeeks} hafta qo‘shdi`,
      parentText: `Davomat ${attendanceRate}% — dars qoldirish o‘qish muddatini ${causes.attendanceMonths} oyga uzaytirdi`
    });
  }

  // P3: Lessons overrun
  signals.push({
    code: 'P3',
    severity: 'warn',
    title: 'Mavzu sur’ati',
    studentText: '«Foizlar» mavzusi 8 darsga cho‘zildi (5 dars kutilgandi)',
    parentText: '3 ta mavzu rejadagidan sekin o‘zlashtirildi'
  });

  // P8: Weak points (Student-only)
  if (child.weakPoints && child.weakPoints.length > 0) {
    signals.push({
      code: 'P8',
      severity: 'alert',
      title: 'Tugallanmagan mavzular',
      studentText: `«${child.weakPoints[0].topic}» bo‘yicha bo‘shliq bor — qo‘shimcha darsga yozil`,
      parentText: 'Qo‘shimcha darsga yozilish tavsiya etiladi',
      actionLabel: 'Yozilish'
    });
  }

  return {
    goal,
    now,
    remaining,
    pace,
    forecast,
    causes,
    signals,
    ladder,
    avgScore,
    totalLessonsAttended: attendedCount
  };
}
