/**
 * Academic Passport computed from Phoenix-MS.
 *
 * Same shape as `calculatePassport`, different source: every number here is
 * the CRM's own — the rung the student sits on (`students.levelCode`), the
 * topics on their plan with the lessons each has actually used against the
 * lessons it was budgeted, their attendance rate, and their marked exams.
 *
 * The one thing Phoenix-MS does not store is the family's GOAL — which
 * institute, by when. Until it does, the school's standard finishing rung
 * (C-DTM, rung 20 of the CRM's own ladder) stands in. It is the only value
 * below that does not come from the CRM, and it is the same for every family.
 */
import { PHOENIX_RUNGS } from './passport';
import type {
  AcademicGoal,
  AcademicPassport,
  ForecastVerdict,
  PassportCauses,
  PassportForecast,
  PassportPace,
  PassportRemaining,
  PassportSignal,
  RungLadderStep } from
'./passport';
import { TODAY } from './mockData';
import { t } from './strings';
import type { PortalExam, PortalTopic, PortalWeakPoint } from './types/portal';

export interface PortalPassportInput {
  /** students.levelCode, e.g. "A3.2" — one of the CRM's 21 rungs. */
  levelCode: string | null;
  topics: PortalTopic[];
  attendanceRate: number | null;
  attendanceSessions: number;
  /** e.g. "MWF · 15:30 – 16:50" — the days tell us the weekly lesson count. */
  groupName: string | null;
  exams: PortalExam[];
  weakPoints: PortalWeakPoint[];
}

/** Lessons a week, read off the CRM's group name. MWF and TTS are both three. */
function lessonsPerWeekOf(groupName: string | null): number {
  const days = (groupName ?? '').toUpperCase();
  if (days.startsWith('MWF') || days.startsWith('TTS')) return 3;
  return 3;
}

export function calculatePassportFromPortal(input: PortalPassportInput): AcademicPassport {
  const goal: AcademicGoal = {
    title: 'DTM tayyorgarligi',
    kind: 'dtm',
    targetDate: '2027-06-20',
    targetDateFormatted: '2027-iyun',
    requiredLevelCode: 'C-DTM',
    requiredLevelTitle: 'DTM Tayyorgarlik',
    minScore: 90
  };

  /* 1. Where the student stands — the CRM's own rung. */
  const currentRung =
  PHOENIX_RUNGS.find((rung) => rung.code === input.levelCode) ?? PHOENIX_RUNGS[0];
  const totalRungs = PHOENIX_RUNGS.length;

  /* 2. The plan Phoenix-MS actually gave this student. Hidden topics are the
        CRM's way of retiring a row, so they are not counted. */
  const visibleTopics = input.topics.filter((topic) => !topic.hiddenAt);
  const topicsDone = visibleTopics.filter((topic) => topic.overallStatus === 'completed').length;
  const topicsTotal = visibleTopics.length;
  const percent = topicsTotal > 0 ? Math.round((topicsDone / topicsTotal) * 100) : 0;

  const openTopics = visibleTopics.filter((topic) => topic.overallStatus !== 'completed');
  /* Lessons still owed on the open topics, from the centre's own budget. A
     topic that has already spent its whole budget is still not finished, so it
     counts as at least one more lesson — otherwise a student whose every topic
     has overrun would be forecast to graduate today. */
  const remainingLessons = openTopics.reduce((sum, topic) => {
    const budget = topic.expectedLessons ?? 0;
    return sum + Math.max(1, budget - topic.lessonsUsed);
  }, 0);

  const remaining: PassportRemaining = {
    levels: Math.max(0, totalRungs - currentRung.sequence),
    topics: openTopics.length,
    lessons: remainingLessons
  };

  /* 3. Pace — the CRM's attendance figure, not a count of rows on screen. */
  const lessonsPerWeek = lessonsPerWeekOf(input.groupName);
  const attendanceRate = input.attendanceRate ?? 0;
  // 40% floor so a very poor record cannot push the forecast to infinity.
  const effectivePace = Math.max(attendanceRate, 40) / 100;

  const pace: PassportPace = {
    lessonsPerWeek,
    attendanceRate,
    effectiveLessonsPerWeek: Math.round(lessonsPerWeek * effectivePace * 100) / 100
  };

  /* 4. Forecast — weeks = lessons still owed ÷ lessons actually attended a week. */
  const neededWeeks = Math.ceil(remainingLessons / (lessonsPerWeek * effectivePace)) || 0;
  const planOnlyWeeks = Math.ceil(remainingLessons / lessonsPerWeek) || 0;
  const attendancePenaltyWeeks = Math.max(0, neededWeeks - planOnlyWeeks);

  const forecastDay = new Date(`${TODAY}T00:00:00`);
  forecastDay.setDate(forecastDay.getDate() + neededWeeks * 7);
  const forecastDate = [
  forecastDay.getFullYear(),
  String(forecastDay.getMonth() + 1).padStart(2, '0'),
  String(forecastDay.getDate()).padStart(2, '0')].
  join('-');
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

  /* 5. Causes — the overrun is now the CRM's own arithmetic: lessons a topic
        used beyond the lessons it was budgeted. It used to be a fixed guess. */
  const slowTopics = visibleTopics.filter(
    (topic) => topic.expectedLessons != null && topic.lessonsUsed > topic.expectedLessons
  );
  const overrunLessons = slowTopics.reduce(
    (sum, topic) => sum + (topic.lessonsUsed - (topic.expectedLessons ?? topic.lessonsUsed)),
    0
  );

  const causes: PassportCauses = {
    planWeeks: planOnlyWeeks,
    planMonths: Math.round((planOnlyWeeks / 4.33) * 10) / 10,
    attendanceWeeks: attendancePenaltyWeeks,
    attendanceMonths: Math.round((attendancePenaltyWeeks / 4.33) * 10) / 10,
    overrunWeeks: Math.ceil(overrunLessons / lessonsPerWeek),
    overrunLessons
  };

  /* 6. The ladder — the CRM's 21 rungs, with this student placed on it. */
  const ladder: RungLadderStep[] = PHOENIX_RUNGS.map((rung) => {
    let state: RungLadderStep['state'] = 'future';
    if (rung.sequence < currentRung.sequence) state = 'completed';else
    if (rung.sequence === currentRung.sequence) state = 'current';else
    if (rung.code === goal.requiredLevelCode) state = 'goal';
    return { sequence: rung.sequence, code: rung.code, title: rung.title, state };
  });

  const avgScore =
  input.exams.length > 0 ?
  Math.round(input.exams.reduce((sum, exam) => sum + (exam.score || 0), 0) / input.exams.length) :
  0;

  /* 7. Signals — each one names a real topic or a real number now. */
  const signals: PassportSignal[] = [];

  if (verdict === 'behind') {
    signals.push({
      code: 'P1',
      severity: 'alert',
      title: 'Kechikish xavfi',
      studentText: `Shu sur‘atda maqsadga ${lateMonths} oy kech yetasan. Davomatingni oshir!`,
      parentText: `Shu sur‘atda maqsadga ${lateMonths} oy kech qoladi. Asosiy sabab — dars qoldirilishi.`
    });
  }

  if (attendanceRate < 90 && attendancePenaltyWeeks > 0) {
    signals.push({
      code: 'P2',
      severity: 'warn',
      title: 'Davomat ko‘rsatkichi',
      studentText: `Davomating ${attendanceRate}% — kelmagan darslar rejangga ${attendancePenaltyWeeks} hafta qo‘shdi`,
      parentText: `Davomat ${attendanceRate}% — dars qoldirish o‘qish muddatini ${causes.attendanceMonths} oyga uzaytirdi`
    });
  }

  if (slowTopics.length > 0) {
    const worst = slowTopics.reduce((a, b) =>
    b.lessonsUsed - (b.expectedLessons ?? 0) > a.lessonsUsed - (a.expectedLessons ?? 0) ? b : a
    );
    signals.push({
      code: 'P3',
      severity: 'warn',
      title: 'Mavzu sur’ati',
      studentText: `«${worst.title}» mavzusi ${worst.lessonsUsed} darsga cho‘zildi (${worst.expectedLessons} dars kutilgandi)`,
      parentText: `${slowTopics.length} ta mavzu rejadagidan sekin o‘zlashtirildi`
    });
  }

  /* Students see their open weak points; Phoenix-MS never sends them to a parent. */
  const openWeakPoints = input.weakPoints.filter((point) => !point.closedAt);
  if (openWeakPoints.length > 0) {
    signals.push({
      code: 'P8',
      severity: 'alert',
      title: 'Tugallanmagan mavzular',
      studentText: `«${openWeakPoints[0].topic}» bo‘yicha bo‘shliq bor — qo‘shimcha darsga yozil`,
      parentText: 'Qo‘shimcha darsga yozilish tavsiya etiladi',
      actionLabel: 'Yozilish'
    });
  }

  return {
    goal,
    now: {
      levelCode: currentRung.code,
      levelTitle: currentRung.title,
      levelSequence: currentRung.sequence,
      totalLevels: totalRungs,
      topicsDone,
      topicsTotal,
      percent
    },
    remaining,
    pace,
    forecast,
    causes,
    signals,
    ladder,
    avgScore,
    totalLessonsAttended: input.attendanceSessions
  };
}
