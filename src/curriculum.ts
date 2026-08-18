/**
 * The curriculum — the single source of truth for learning content.
 *
 *   LEVEL (A1)  →  MODULE (A1.1)  →  TOPIC (01)  →  video / lesson / practice / homework
 *
 * A level is a curriculum stage; a module is a section inside it; a topic is one
 * lesson. Module exams are NOT stored here — they live in `ChildRecord.exams`
 * and are matched by `examTopic`, so the Lessons page, the Progress page and the
 * exam list can never disagree.
 *
 * Aggregate counters (`topicsDone` / `topicsTotal` on a child) are derived from
 * this file rather than stored, so progress is never hardcoded in two places.
 *
 * NOTE — mock data, like the rest of the app. `mastery` is null whenever a topic
 * has never been assessed and every calculation treats null as "no data", never
 * as zero. Video thumbnails are null because the platform has no thumbnail
 * storage yet; see MISSING DATA at the bottom of this file.
 */

import type { Homework } from './mockData';

export interface TopicVideo {
  title: string;
  /** Runtime in seconds. */
  seconds: number;
  /** Real thumbnail URL, or null when the platform has none for this topic. */
  thumbnail: string | null;
  /** Playable source, or null while the media backend is not connected. */
  url: string | null;
  watched: boolean;
}

export interface TopicDocumentFile {
  id: number;
  title: string;
  fileName: string;
  sizeStr: string;
  fileType: 'pdf' | 'pptx' | 'docx' | 'doc';
  url?: string;
  pageCount?: number;
}

export interface TopicPresentation {
  title: string;
  files: TopicDocumentFile[];
}

export interface TopicKonspekt {
  title: string;
  summary: string;
  formulas: string[];
  keyPoints: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface TopicQuiz {
  title: string;
  questionCount: number;
  questions: QuizQuestion[];
}

export interface TopicContent {
  /** A topic may carry one or several videos, in teaching order. */
  videos: TopicVideo[];
  /** Written lesson material. */
  lesson: boolean;
  practice: boolean;
  /** Reuses the platform's homework states; '' means none assigned. */
  homework: Homework;
  presentation?: TopicPresentation;
  konspekt?: TopicKonspekt;
  quiz?: TopicQuiz;
}

export interface CurriculumTopic {
  id: number;
  title: string;
  /** True once the topic has been taught and finished — drives progression. */
  studied: boolean;
  /** Demonstrated mastery 0–100 from assessments; null when never assessed. */
  mastery: number | null;
  /** Lessons the centre plans for this topic — drives workload estimates. */
  lessons: number;
  content: TopicContent;
}

export interface CurriculumModule {
  id: number;
  /** Display code, e.g. "A1.2". */
  code: string;
  title: string;
  /**
   * Title of the exam covering this module. Resolved against the child's real
   * exam records — this file never stores a score.
   */
  examTopic: string | null;
  topics: CurriculumTopic[];
}

export interface CurriculumLevel {
  id: number;
  /** Display code, e.g. "A1". */
  code: string;
  title: string;
  modules: CurriculumModule[];
}

export interface AcademicGoal {
  title: string;
  currentLevel: string;
  targetLevel: string;
  levelGap: number;
  targetDate: string | null;
  requiredMastery: number;
}

/** A topic counts as mastered from this demonstrated-mastery level up. */
export const MASTERY_MASTERED = 70;
/** Below this, previously studied material needs revisiting. */
export const MASTERY_REVIEW = 50;

/* ── Content helpers ───────────────────────────────────────────── */

function video(title: string, seconds: number, watched: boolean): TopicVideo {
  // thumbnail and url stay null until the platform stores real media — the UI
  // renders a typographic tile and an honest "not uploaded yet" player rather
  // than inventing an image or a stream.
  return { title, seconds, thumbnail: null, url: null, watched };
}

function content(
videos: TopicVideo[],
homework: Homework,
practice = true)
: TopicContent {
  return { videos, lesson: true, practice, homework };
}

/* ── Ali — A1 complete, currently inside A2.1 ──────────────────── */

const aliLevels: CurriculumLevel[] = [
{
  id: 1,
  code: 'A1',
  title: "Boshlang‘ich matematika",
  modules: [
  {
    id: 11,
    code: 'A1.1',
    title: 'Butun sonlar',
    examTopic: 'Butun sonlar',
    topics: [
    { id: 101, title: "Sonlarni o‘qish", studied: true, mastery: 95, lessons: 2, content: content([video("Sonlarni o‘qish", 512, true)], 'done') },
    { id: 102, title: 'Sonlarni taqqoslash', studied: true, mastery: 92, lessons: 2, content: content([video('Sonlarni taqqoslash', 604, true)], 'done') },
    { id: 103, title: "Qo‘shish", studied: true, mastery: 88, lessons: 3, content: content([video("Qo‘shish usullari", 742, true)], 'done') },
    { id: 104, title: 'Ayirish', studied: true, mastery: 85, lessons: 3, content: content([video('Ayirish usullari', 762, true)], 'done') },
    { id: 105, title: "Ko‘paytirish", studied: true, mastery: 79, lessons: 3, content: content([video("Ko‘paytirish jadvali", 831, true)], 'partial') },
    { id: 106, title: "Bo‘lish", studied: true, mastery: 74, lessons: 3, content: content([video("Bo‘lish amali", 794, true)], 'done') }]

  },
  {
    id: 12,
    code: 'A1.2',
    title: 'Kasrlar',
    examTopic: 'Kasrlar',
    topics: [
    { id: 107, title: 'Kasr tushunchasi', studied: true, mastery: 71, lessons: 3, content: content([video('Kasr nima?', 566, true)], 'done') },
    { id: 108, title: 'Kasrlarni taqqoslash', studied: true, mastery: 58, lessons: 3, content: content([video('Kasrlarni taqqoslash', 688, true)], 'partial') },
    { id: 109, title: "Kasrlarni qo‘shish", studied: true, mastery: 52, lessons: 4, content: content([video("Kasrlarni qo‘shish", 903, true)], 'partial') },
    { id: 110, title: 'Kasrlarni ayirish', studied: true, mastery: 47, lessons: 4, content: content([video('Kasrlarni ayirish', 851, true)], 'not') },
    { id: 111, title: 'Maxrajni tenglash', studied: true, mastery: 44, lessons: 4, content: content([video('Umumiy maxraj', 967, false)], 'not') }]

  },
  {
    id: 13,
    code: 'A1.3',
    title: "O‘nli kasrlar",
    examTopic: "O‘nli kasrlar",
    topics: [
    { id: 112, title: "O‘nli kasr tushunchasi", studied: true, mastery: 82, lessons: 2, content: content([video("O‘nli kasr nima?", 498, true)], 'done') },
    { id: 113, title: "O‘nli kasrlarni taqqoslash", studied: true, mastery: 76, lessons: 2, content: content([video("O‘nli kasrlarni taqqoslash", 585, true)], 'done') },
    { id: 114, title: "O‘nli kasrlar ustida amallar", studied: true, mastery: 68, lessons: 3, content: content([video('Amallar tartibi', 812, true)], 'partial') },
    { id: 115, title: 'Vergul bilan amallar', studied: true, mastery: 71, lessons: 3, content: content([video("Vergul qayerga qo‘yiladi", 733, true)], 'done') }]

  }]

},
{
  id: 2,
  code: 'A2',
  title: "O‘rta matematika",
  modules: [
  {
    id: 21,
    code: 'A2.1',
    title: 'Foizlar',
    examTopic: null,
    topics: [
    { id: 116, title: 'Foiz tushunchasi', studied: true, mastery: 81, lessons: 3, content: content([video('Foiz nima?', 541, true)], 'done') },
    { id: 117, title: 'Foizni topish', studied: false, mastery: null, lessons: 3, content: content([video('Foizni topish', 694, false), video('Foizlarga doir misollar', 458, false)], 'not') },
    { id: 118, title: 'Chegirma va ustama', studied: false, mastery: null, lessons: 3, content: content([video('Chegirma hisoblash', 776, false)], '') }]

  },
  {
    id: 22,
    code: 'A2.2',
    title: 'Nisbat va proporsiya',
    examTopic: null,
    topics: [
    { id: 119, title: 'Nisbat tushunchasi', studied: false, mastery: null, lessons: 3, content: content([video('Nisbat nima?', 522, false)], '') },
    { id: 120, title: "To‘g‘ri proporsiya", studied: false, mastery: null, lessons: 3, content: content([video("To‘g‘ri proporsiya", 648, false)], '') },
    { id: 121, title: 'Teskari proporsiya', studied: false, mastery: null, lessons: 3, content: content([video('Teskari proporsiya', 671, false)], '') }]

  },
  {
    id: 23,
    code: 'A2.3',
    title: 'Amaliy hisob',
    examTopic: null,
    topics: [
    { id: 122, title: 'Pul masalalari', studied: false, mastery: null, lessons: 4, content: content([video('Pul masalalari', 812, false)], '') },
    { id: 123, title: 'Byudjet tuzish', studied: false, mastery: null, lessons: 3, content: content([video('Byudjet tuzish', 745, false)], '') }]

  }]

},
{
  id: 3,
  code: 'A3',
  title: 'Algebra asoslari',
  modules: [
  {
    id: 31,
    code: 'A3.1',
    title: 'Ifodalar',
    examTopic: null,
    topics: [
    { id: 124, title: 'Harfli ifodalar', studied: false, mastery: null, lessons: 4, content: content([video('Harfli ifodalar', 704, false)], '') },
    { id: 125, title: 'Ifodalarni soddalashtirish', studied: false, mastery: null, lessons: 4, content: content([video('Soddalashtirish', 758, false)], '') }]

  },
  {
    id: 32,
    code: 'A3.2',
    title: 'Tenglamalar',
    examTopic: null,
    topics: [
    { id: 126, title: 'Chiziqli tenglama', studied: false, mastery: null, lessons: 5, content: content([video('Chiziqli tenglama', 889, false)], '') },
    { id: 127, title: 'Tenglamalar sistemasi', studied: false, mastery: null, lessons: 5, content: content([video('Tenglamalar sistemasi', 932, false)], '') }]
  },
  {
    id: 33,
    code: 'A3.3',
    title: "Ko‘phadlar",
    examTopic: null,
    topics: [
    { id: 128, title: "Qisqa ko‘paytirish", studied: false, mastery: null, lessons: 4, content: content([video("Ko‘paytirish formulalari", 710, false)], '') },
    { id: 129, title: "Ko‘paytuvchilarga ajratish", studied: false, mastery: null, lessons: 4, content: content([video("Guruhlash usuli", 640, false)], '') }]
  }]
},
{
  id: 4,
  code: 'B1',
  title: 'Algebra va funksiyalar',
  modules: [
  {
    id: 41,
    code: 'B1.1',
    title: 'Kvadrat tenglamalar',
    examTopic: 'Kvadrat tenglamalar',
    topics: [
    { id: 130, title: 'Diskriminant', studied: false, mastery: null, lessons: 3, content: content([video('Diskriminant', 721, false)], '') },
    { id: 131, title: 'Viet teoremasi', studied: false, mastery: null, lessons: 3, content: content([video('Viet teoremasi', 654, false)], '') },
    { id: 132, title: 'Tenglama ildizlari', studied: false, mastery: null, lessons: 3, content: content([video('Ildizlarni topish', 788, false)], '') }]
  },
  {
    id: 42,
    code: 'B1.2',
    title: 'Funksiyalar',
    examTopic: 'Funksiyalar',
    topics: [
    { id: 133, title: 'Funksiya tushunchasi', studied: false, mastery: null, lessons: 3, content: content([video('Funksiya nima?', 612, false)], '') },
    { id: 134, title: 'Chiziqli funksiya', studied: false, mastery: null, lessons: 3, content: content([video('Chiziqli funksiya', 705, false)], '') }]
  },
  {
    id: 43,
    code: 'B1.3',
    title: 'Ratsional ifodalar',
    examTopic: null,
    topics: [
    { id: 135, title: 'Kasr ratsional ifodalar', studied: false, mastery: null, lessons: 4, content: content([video('Kasr ifodalar', 760, false)], '') }]
  }]
},
{
  id: 5,
  code: 'B2',
  title: 'Grafiklar va geometriya',
  modules: [
  {
    id: 51,
    code: 'B2.1',
    title: 'Koordinata tekisligi',
    examTopic: null,
    topics: [
    { id: 136, title: 'Nuqta va kesma', studied: false, mastery: null, lessons: 2, content: content([video('Nuqta va kesma', 486, false)], '') },
    { id: 137, title: 'Grafik qurish', studied: false, mastery: null, lessons: 3, content: content([video('Grafik qurish', 731, false)], '') }]
  },
  {
    id: 52,
    code: 'B2.2',
    title: 'Grafik tahlili',
    examTopic: null,
    topics: [
    { id: 138, title: "O‘sish va kamayish", studied: false, mastery: null, lessons: 3, content: content([video("O‘sish va kamayish", 668, false)], '') },
    { id: 139, title: 'Ekstremum nuqtalari', studied: false, mastery: null, lessons: 4, content: content([video('Ekstremum nuqtalari', 852, false)], '') }]
  },
  {
    id: 53,
    code: 'B2.3',
    title: 'Planimetriya',
    examTopic: null,
    topics: [
    { id: 140, title: 'Uchburchaklar', studied: false, mastery: null, lessons: 4, content: content([video('Uchburchaklar', 810, false)], '') }]
  }]
},
{
  id: 6,
  code: 'B3',
  title: 'Progressiyalar',
  modules: [
  {
    id: 61,
    code: 'B3.1',
    title: 'Arifmetik progressiya',
    examTopic: null,
    topics: [
    { id: 141, title: 'Umumiy had formulasi', studied: false, mastery: null, lessons: 3, content: content([video('Umumiy had', 624, false)], '') },
    { id: 142, title: 'Yig‘indi formulasi', studied: false, mastery: null, lessons: 3, content: content([video('Yig‘indi formulasi', 690, false)], '') }]
  },
  {
    id: 62,
    code: 'B3.2',
    title: 'Geometrik progressiya',
    examTopic: null,
    topics: [
    { id: 143, title: 'Maxraj va hadlar', studied: false, mastery: null, lessons: 4, content: content([video('Geometrik progressiya', 803, false)], '') }]
  },
  {
    id: 63,
    code: 'B3.3',
    title: 'Stereometriya',
    examTopic: null,
    topics: [
    { id: 144, title: 'Fazoviy jismlar', studied: false, mastery: null, lessons: 4, content: content([video('Fazoviy jismlar', 840, false)], '') }]
  }]
},
{
  id: 7,
  code: 'C1',
  title: 'SAT va Xalqaro Matematika',
  modules: [
  {
    id: 71,
    code: 'C1.1',
    title: 'Heart of Algebra',
    examTopic: 'SAT Algebra',
    topics: [
    { id: 145, title: 'Linear Equations & Systems', studied: false, mastery: null, lessons: 4, content: content([video('SAT Algebra', 910, false)], '') },
    { id: 146, title: 'Linear Inequalities', studied: false, mastery: null, lessons: 3, content: content([video('Inequalities', 820, false)], '') }]
  },
  {
    id: 72,
    code: 'C1.2',
    title: 'Problem Solving & Data',
    examTopic: null,
    topics: [
    { id: 147, title: 'Ratios, Rates & Proportions', studied: false, mastery: null, lessons: 3, content: content([video('Data Analysis', 780, false)], '') }]
  },
  {
    id: 73,
    code: 'C1.3',
    title: 'Passport to Advanced Math',
    examTopic: 'Advanced Math',
    topics: [
    { id: 148, title: 'Nonlinear Functions', studied: false, mastery: null, lessons: 4, content: content([video('Nonlinear Math', 890, false)], '') }]
  }]
},
{
  id: 8,
  code: 'C2',
  title: 'DTM va Milliy Sertifikat',
  modules: [
  {
    id: 81,
    code: 'C2.1',
    title: 'DTM Test Strategiyalari',
    examTopic: 'DTM',
    topics: [
    { id: 149, title: 'Standart test tahlili', studied: false, mastery: null, lessons: 3, content: content([video('DTM Test', 750, false)], '') }]
  },
  {
    id: 82,
    code: 'C2.2',
    title: 'Murakkab misollar',
    examTopic: null,
    topics: [
    { id: 150, title: 'Trigonometrik tenglamalar', studied: false, mastery: null, lessons: 4, content: content([video('Trigonometriya', 830, false)], '') }]
  },
  {
    id: 83,
    code: 'C2.3',
    title: 'Milliy Sertifikat Imtihoni',
    examTopic: 'Sertifikat',
    topics: [
    { id: 151, title: 'A+ daraja imtihon amaliyoti', studied: false, mastery: null, lessons: 4, content: content([video('Milliy Sertifikat', 820, false)], '') }]
  }]
},
{
  id: 9,
  code: 'C3',
  title: 'Matematik Analiz Asoslari',
  modules: [
  {
    id: 91,
    code: 'C3.1',
    title: 'Ketma-ketlik va limitlar',
    examTopic: null,
    topics: [
    { id: 152, title: 'Funksiya limiti', studied: false, mastery: null, lessons: 4, content: content([video('Limitlar', 860, false)], '') }]
  },
  {
    id: 92,
    code: 'C3.2',
    title: 'Hosilaning ta’rifi',
    examTopic: null,
    topics: [
    { id: 153, title: 'Hosila hisoblash qoidalari', studied: false, mastery: null, lessons: 4, content: content([video('Hosilalar', 920, false)], '') }]
  },
  {
    id: 93,
    code: 'C3.3',
    title: 'Integral tushunchasi',
    examTopic: null,
    topics: [
    { id: 154, title: 'Aniqmas integral', studied: false, mastery: null, lessons: 5, content: content([video('Integrallar', 950, false)], '') }]
  }]
},
{
  id: 10,
  code: 'D1',
  title: 'Olimpiada Matematikasi I',
  modules: [
  {
    id: 101,
    code: 'D1.1',
    title: 'Sonlar nazariyasi',
    examTopic: 'Olimpiada I',
    topics: [
    { id: 155, title: 'Taqqoslamalar va qoldiqlar', studied: false, mastery: null, lessons: 4, content: content([video('Sonlar nazariyasi', 880, false)], '') }]
  },
  {
    id: 102,
    code: 'D1.2',
    title: 'Kombinatorika asoslari',
    examTopic: null,
    topics: [
    { id: 156, title: 'Dirixle prinsipi', studied: false, mastery: null, lessons: 4, content: content([video('Dirixle', 760, false)], '') }]
  },
  {
    id: 103,
    code: 'D1.3',
    title: 'Grafik nazariyasi',
    examTopic: null,
    topics: [
    { id: 157, title: 'Graflar va daraxtlar', studied: false, mastery: null, lessons: 4, content: content([video('Graflar', 840, false)], '') }]
  }]
},
{
  id: 11,
  code: 'D2',
  title: 'Olimpiada Geometriyasi II',
  modules: [
  {
    id: 111,
    code: 'D2.1',
    title: 'Cheva va Menelay',
    examTopic: 'Olimpiada II',
    topics: [
    { id: 158, title: 'Cheva teoremasi', studied: false, mastery: null, lessons: 4, content: content([video('Cheva', 900, false)], '') }]
  },
  {
    id: 112,
    code: 'D2.2',
    title: 'Aylana va to‘rtburchaklar',
    examTopic: null,
    topics: [
    { id: 159, title: 'Inscribed Quad Properties', studied: false, mastery: null, lessons: 4, content: content([video('Aylana geometriyasi', 870, false)], '') }]
  },
  {
    id: 113,
    code: 'D2.3',
    title: 'Trigonometrik usullar',
    examTopic: null,
    topics: [
    { id: 160, title: 'Geometriyada trigonometriya', studied: false, mastery: null, lessons: 4, content: content([video('Trig usullari', 830, false)], '') }]
  }]
},
{
  id: 12,
  code: 'D3',
  title: 'Murakkab Tengsizliklar',
  modules: [
  {
    id: 121,
    code: 'D3.1',
    title: 'Koshi-Bunyakovskiy',
    examTopic: 'Olimpiada III',
    topics: [
    { id: 161, title: 'CBS tengsizligi', studied: false, mastery: null, lessons: 4, content: content([video('CBS', 910, false)], '') }]
  },
  {
    id: 122,
    code: 'D3.2',
    title: 'Yensen tengsizligi',
    examTopic: null,
    topics: [
    { id: 162, title: 'Qavariq funksiyalar', studied: false, mastery: null, lessons: 4, content: content([video('Yensen', 890, false)], '') }]
  },
  {
    id: 123,
    code: 'D3.3',
    title: 'Funksional tenglamalar',
    examTopic: null,
    topics: [
    { id: 163, title: 'Koshi funksional tenglamasi', studied: false, mastery: null, lessons: 5, content: content([video('Funksional', 940, false)], '') }]
  }]
},
/* ── E band — Geometriya (parallel yo‘nalish) ─────────────────────
   The E track is elective geometry: it can be studied alongside any
   main-path level (A1..D3), so it sits outside the main progression. */
{
  id: 13,
  code: 'E1',
  title: 'Planimetriya',
  modules: [
  {
    id: 131,
    code: 'E1.1',
    title: 'Uchburchaklar',
    examTopic: 'Geometriya I',
    topics: [
    { id: 164, title: 'Uchburchak turlari va burchaklar', studied: false, mastery: null, lessons: 4, content: content([video('Uchburchaklar', 920, false)], '') }]
  },
  {
    id: 132,
    code: 'E1.2',
    title: 'Aylana va doira',
    examTopic: null,
    topics: [
    { id: 165, title: 'Aylana, vatar va urinma', studied: false, mastery: null, lessons: 4, content: content([video('Aylana', 880, false)], '') }]
  },
  {
    id: 133,
    code: 'E1.3',
    title: 'Yuzalar',
    examTopic: null,
    topics: [
    { id: 166, title: 'Ko‘pburchaklar yuzasi', studied: false, mastery: null, lessons: 5, content: content([video('Yuzalar', 960, false)], '') }]
  }]
},
{
  id: 14,
  code: 'E2',
  title: 'Stereometriya',
  modules: [
  {
    id: 141,
    code: 'E2.1',
    title: 'Prizma va parallelepiped',
    examTopic: 'Geometriya II',
    topics: [
    { id: 167, title: 'Prizma hajmi va sirti', studied: false, mastery: null, lessons: 4, content: content([video('Prizma', 900, false)], '') }]
  },
  {
    id: 142,
    code: 'E2.2',
    title: 'Piramida va konus',
    examTopic: null,
    topics: [
    { id: 168, title: 'Piramida hajmi va sirti', studied: false, mastery: null, lessons: 5, content: content([video('Piramida', 930, false)], '') }]
  },
  {
    id: 143,
    code: 'E2.3',
    title: 'Shar va sfera',
    examTopic: null,
    topics: [
    { id: 169, title: 'Shar hajmi va sirt yuzasi', studied: false, mastery: null, lessons: 5, content: content([video('Shar', 980, false)], '') }]
  }]
},
{
  id: 15,
  code: 'E3',
  title: 'Analitik geometriya',
  modules: [
  {
    id: 151,
    code: 'E3.1',
    title: 'Koordinatalar usuli',
    examTopic: 'Geometriya III',
    topics: [
    { id: 170, title: 'Nuqta va kesma koordinatalari', studied: false, mastery: null, lessons: 4, content: content([video('Koordinatalar', 890, false)], '') }]
  },
  {
    id: 152,
    code: 'E3.2',
    title: 'Vektorlar',
    examTopic: null,
    topics: [
    { id: 171, title: 'Vektorlar ustida amallar', studied: false, mastery: null, lessons: 4, content: content([video('Vektorlar', 910, false)], '') }]
  },
  {
    id: 153,
    code: 'E3.3',
    title: 'Geometrik isbotlash',
    examTopic: null,
    topics: [
    { id: 172, title: 'Isbotlash usullari va masalalar', studied: false, mastery: null, lessons: 5, content: content([video('Isbotlash', 990, false)], '') }]
  }]
}];


const aliGoal: AcademicGoal = {
  title: 'Matematika — B2 daraja',
  currentLevel: 'A2',
  targetLevel: 'B2',
  levelGap: 2,
  targetDate: '2027-05-20',
  requiredMastery: 80
};

/* ── Laylo — B1 complete, currently inside B2.2 ────────────────── */

const layloLevels: CurriculumLevel[] = [
{
  id: 1,
  code: 'B1',
  title: 'Algebra va funksiyalar',
  modules: [
  {
    id: 11,
    code: 'B1.1',
    title: 'Kvadrat tenglamalar',
    examTopic: 'Kvadrat tenglamalar',
    topics: [
    { id: 201, title: 'Diskriminant', studied: true, mastery: 94, lessons: 3, content: content([video('Diskriminant', 721, true)], 'done') },
    { id: 202, title: 'Viet teoremasi', studied: true, mastery: 90, lessons: 3, content: content([video('Viet teoremasi', 654, true)], 'done') },
    { id: 203, title: 'Tenglama ildizlari', studied: true, mastery: 85, lessons: 3, content: content([video('Ildizlarni topish', 788, true)], 'done') }]

  },
  {
    id: 12,
    code: 'B1.2',
    title: 'Funksiyalar',
    examTopic: 'Funksiyalar',
    topics: [
    { id: 204, title: 'Funksiya tushunchasi', studied: true, mastery: 88, lessons: 3, content: content([video('Funksiya nima?', 612, true)], 'done') },
    { id: 205, title: 'Chiziqli funksiya', studied: true, mastery: 85, lessons: 3, content: content([video('Chiziqli funksiya', 705, true)], 'done') },
    { id: 206, title: 'Kvadratik funksiya', studied: true, mastery: 79, lessons: 4, content: content([video('Kvadratik funksiya', 843, true)], 'partial') }]

  }]

},
{
  id: 2,
  code: 'B2',
  title: 'Grafiklar',
  modules: [
  {
    id: 21,
    code: 'B2.1',
    title: 'Koordinata tekisligi',
    examTopic: null,
    topics: [
    { id: 207, title: 'Nuqta va kesma', studied: true, mastery: 92, lessons: 2, content: content([video('Nuqta va kesma', 486, true)], 'done') },
    { id: 208, title: 'Grafik qurish', studied: true, mastery: 83, lessons: 3, content: content([video('Grafik qurish', 731, true)], 'done') }]

  },
  {
    id: 22,
    code: 'B2.2',
    title: 'Grafik tahlili',
    examTopic: null,
    topics: [
    { id: 209, title: "O‘sish va kamayish", studied: true, mastery: 76, lessons: 3, content: content([video("O‘sish va kamayish", 668, true)], 'done') },
    { id: 210, title: 'Ekstremum nuqtalari', studied: false, mastery: null, lessons: 4, content: content([video('Ekstremum nuqtalari', 852, false)], 'not') }]

  }]

},
{
  id: 3,
  code: 'B3',
  title: 'Progressiyalar',
  modules: [
  {
    id: 31,
    code: 'B3.1',
    title: 'Arifmetik progressiya',
    examTopic: null,
    topics: [
    { id: 211, title: 'Umumiy had formulasi', studied: false, mastery: null, lessons: 3, content: content([video('Umumiy had', 624, false)], '') },
    { id: 212, title: 'Yig‘indi formulasi', studied: false, mastery: null, lessons: 3, content: content([video('Yig‘indi formulasi', 690, false)], '') }]

  },
  {
    id: 32,
    code: 'B3.2',
    title: 'Geometrik progressiya',
    examTopic: null,
    topics: [
    { id: 213, title: 'Maxraj va hadlar', studied: false, mastery: null, lessons: 4, content: content([video('Geometrik progressiya', 803, false)], '') }]

  }]

}];


const layloGoal: AcademicGoal = {
  title: 'Matematika — C1 daraja',
  currentLevel: 'B2',
  targetLevel: 'C1',
  levelGap: 2,
  targetDate: '2027-05-20',
  requiredMastery: 85
};

const BY_CHILD: Record<number, {levels: CurriculumLevel[];goal: AcademicGoal;}> = {
  1: { levels: aliLevels, goal: aliGoal },
  2: { levels: layloLevels, goal: layloGoal }
};

export function curriculumFor(childId: number): CurriculumLevel[] {
  return BY_CHILD[childId]?.levels ?? aliLevels;
}

export function goalFor(childId: number): AcademicGoal {
  return BY_CHILD[childId]?.goal ?? aliGoal;
}

/* ── Flatteners ────────────────────────────────────────────────── */

export function allModules(levels: CurriculumLevel[]): CurriculumModule[] {
  return levels.flatMap((level) => level.modules);
}

export function allTopics(levels: CurriculumLevel[]): CurriculumTopic[] {
  return allModules(levels).flatMap((module) => module.topics);
}

/** Two-digit position label inside its module, e.g. "04". */
export function topicNumber(module: CurriculumModule, topic: CurriculumTopic): string {
  return String(module.topics.indexOf(topic) + 1).padStart(2, '0');
}

/* ── Derived counters (never stored twice) ─────────────────────── */

export function topicCount(levels: CurriculumLevel[]): number {
  return allTopics(levels).length;
}

export function masteredCount(levels: CurriculumLevel[]): number {
  return allTopics(levels).filter(
    (topic) => topic.mastery !== null && topic.mastery >= MASTERY_MASTERED
  ).length;
}

export function completedCount(levels: CurriculumLevel[]): number {
  return allTopics(levels).filter((topic) => topic.studied).length;
}

/*
 * MISSING DATA — what a real backend must add for this UI to be fully live:
 *   • TopicVideo.thumbnail   — thumbnail URL per topic video (null today)
 *   • TopicVideo.url         — playable stream per topic video (null today)
 *   • TopicVideo.watched     — per-student watch state, not per-topic
 *   • TopicContent.homework  — per-student homework state, not per-topic
 *   • module unlock policy   — whether a failed module exam blocks the next
 *                              module; `access.ts` currently gates on topic
 *                              completion only and surfaces the exam result.
 */
