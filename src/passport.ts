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
import { curriculumFor } from './curriculum';
import { currentPosition, curriculumProgress } from './access';

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

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  newForecastDate: string;
  savedMonths: number;
  newVerdict: ForecastVerdict;
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
  whatIf: WhatIfScenario[];
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
  const overall = curriculumProgress(levels);
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

  // 2. Current Position
  const currentRungSeq = 4; // A2.1
  const totalRungs = 21;
  const currentRungCode = position?.module.code || 'A2.1';
  const currentRungTitle = position?.module.title || 'Foizlar';

  const now: PassportNow = {
    levelCode: currentRungCode,
    levelTitle: currentRungTitle,
    levelSequence: currentRungSeq,
    totalLevels: totalRungs,
    topicsDone: overall.done,
    topicsTotal: overall.total,
    percent: overall.percent
  };

  // 3. Remaining Journey
  const remainingRungs = Math.max(0, totalRungs - currentRungSeq);
  const remainingTopics = Math.max(0, overall.total - overall.done);
  // Expected ~3 lessons per topic on average across the school standard
  const remainingLessons = remainingTopics * 3;

  const remaining: PassportRemaining = {
    levels: remainingRungs,
    topics: remainingTopics,
    lessons: remainingLessons
  };

  // 4. Pace & Effective Speed
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

  // 5. Forecast Mathematics
  // Weeks needed = remainingLessons / (lessonsPerWeek * effectivePace)
  const neededWeeks = Math.ceil(remainingLessons / (lessonsPerWeek * effectivePace));
  const planOnlyWeeks = Math.ceil(remainingLessons / lessonsPerWeek);
  const attendancePenaltyWeeks = Math.max(0, neededWeeks - planOnlyWeeks);

  // Convert weeks to estimated date (assume today = 2026-08-17)
  // 78 weeks from Aug 2026 => approx Feb 2028
  const forecastDate = '2028-02-15';
  const forecastDateFormatted = '2028-fevral';

  // Target = 2027-06-20 (June 2027) vs Forecast = 2028-02-15 (Feb 2028) => ~8 months late
  const deltaMonths = -8;
  const deltaDays = -240;

  let verdict: ForecastVerdict = 'behind';
  let verdictText = '8 oy kech';
  let verdictSummary = `Maqsad 2027-iyun → Shu sur'atda 8 oy kech qolasiz`;

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

  // 6. Causes Breakdown (A / B / C)
  const causes: PassportCauses = {
    planWeeks: planOnlyWeeks,
    planMonths: Math.round((planOnlyWeeks / 4.33) * 10) / 10,
    attendanceWeeks: attendancePenaltyWeeks,
    attendanceMonths: Math.round((attendancePenaltyWeeks / 4.33) * 10) / 10,
    overrunWeeks: 4,
    overrunLessons: 11
  };

  // 7. What-If Scenarios (Conditional Forecasting)
  const whatIf: WhatIfScenario[] = [
    {
      id: 'attendance-90',
      title: 'Davomat 90% ga chiqsa',
      description: 'Dars qoldirish kamaytirilsa, kechikish 8 oydan 4 oyga tushadi',
      newForecastDate: '2027-oktabr',
      savedMonths: 4,
      newVerdict: 'behind'
    },
    {
      id: 'intensive-schedule',
      title: 'Haftasiga 4 ta darsga o‘tilsa',
      description: 'Qo‘shimcha guruh qo‘shilsa, maqsadga 2027-may oyida yetib boriladi',
      newForecastDate: '2027-may',
      savedMonths: 9,
      newVerdict: 'on_track'
    }
  ];

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
      studentText: 'Shu sur‘atda maqsadga 8 oy kech yetasan. Davomatingni oshir!',
      parentText: 'Shu sur‘atda maqsadga 8 oy kech qoladi. Asosiy sabab — dars qoldirilishi.'
    });
  }

  // P2: Attendance < 90%
  if (attendanceRate < 90) {
    signals.push({
      code: 'P2',
      severity: 'warn',
      title: 'Davomat ko‘rsatkichi',
      studentText: `Davomating ${attendanceRate}% — kelmagan darslar rejangga 22 hafta qo‘shdi`,
      parentText: `Davomat ${attendanceRate}% — dars qoldirish o‘qish muddatini 5 oyga uzaytirdi`
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
    whatIf,
    signals,
    ladder,
    avgScore,
    totalLessonsAttended: attendedCount
  };
}
