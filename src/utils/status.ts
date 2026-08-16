import { t } from '../strings';
import type { Tone } from '../tokens';
import type { Conspect, Engagement, Homework, Presence } from '../mockData';

export interface PillSpec {
  tone: Tone;
  label: string;
}

export function presencePill(p: Presence): PillSpec | null {
  switch (p) {
    case 'present':
      return { tone: 'green', label: t.present };
    case 'late':
      return { tone: 'amber', label: t.late };
    case 'absent':
      return { tone: 'red', label: t.absent };
    case 'pending':
      return { tone: 'grey', label: t.unmarked };
    default:
      return null;
  }
}

export function homeworkPill(h: Homework): PillSpec | null {
  switch (h) {
    case 'done':
      return { tone: 'green', label: t.hwDone };
    case 'partial':
      return { tone: 'amber', label: t.hwPartial };
    case 'not':
      return { tone: 'red', label: t.hwNot };
    default:
      return null;
  }
}

export function conspectPill(c: Conspect): PillSpec | null {
  switch (c) {
    case 'full':
      return { tone: 'green', label: t.conspectFull };
    case 'partial':
      return { tone: 'amber', label: t.conspectPartial };
    default:
      return null;
  }
}

export function engagementPill(e: Engagement): PillSpec | null {
  switch (e) {
    case 'high':
      return { tone: 'green', label: t.engHigh };
    case 'medium':
      return { tone: 'amber', label: t.engMedium };
    case 'low':
      return { tone: 'red', label: t.engLow };
    default:
      return null;
  }
}

export function topicPill(status: 'completed' | 'in_progress' | 'not_started'): PillSpec {
  if (status === 'completed') return { tone: 'green', label: t.topicCompleted };
  if (status === 'in_progress') return { tone: 'amber', label: t.topicInProgress };
  return { tone: 'grey', label: t.topicNotStarted };
}

export function examPill(result: 'pass' | 'conditional' | 'fail'): PillSpec {
  if (result === 'pass') return { tone: 'green', label: t.examPass };
  if (result === 'conditional') return { tone: 'amber', label: t.examConditional };
  return { tone: 'red', label: t.examFail };
}