/**
 * Asia/Tashkent Timezone & Date Utilities
 * All CRM booking logic relies on Asia/Tashkent (UTC+5).
 */

const TASHKENT_TIMEZONE = 'Asia/Tashkent';

/**
 * Returns current Date object shifted to Asia/Tashkent representation.
 */
export function getTashkentNow(): Date {
  const now = new Date();
  // Get time string in Tashkent timezone
  const tashkentStr = now.toLocaleString('en-US', { timeZone: TASHKENT_TIMEZONE });
  return new Date(tashkentStr);
}

/**
 * Returns current date in Tashkent as "YYYY-MM-DD"
 */
export function getTashkentTodayIso(): string {
  const d = getTashkentNow();
  return formatIsoDate(d);
}

/**
 * Formats a Date object to "YYYY-MM-DD" using its local components
 */
export function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses "YYYY-MM-DD" into a local Date without UTC day shifting
 */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Returns current time in Tashkent as "HH:mm" (24-hour)
 */
export function getTashkentCurrentTime(): string {
  const d = getTashkentNow();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Returns day of week: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
 */
export function getIsoDayOfWeek(isoOrDate: string | Date): number {
  const d = typeof isoOrDate === 'string' ? parseIsoDate(isoOrDate) : isoOrDate;
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return day === 0 ? 7 : day;
}

/**
 * Returns Monday of the week containing the given ISO date
 */
export function getMondayOfWeek(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  const dow = getIsoDayOfWeek(d); // 1 = Mon ... 7 = Sun
  d.setDate(d.getDate() - (dow - 1));
  return formatIsoDate(d);
}

/**
 * Returns Sunday of the week containing the given ISO date
 */
export function getSundayOfWeek(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  const dow = getIsoDayOfWeek(d);
  d.setDate(d.getDate() + (7 - dow));
  return formatIsoDate(d);
}

/**
 * Returns 7 days of the week (Mon..Sun) starting from the Monday of the given date
 */
export function getDaysOfWeek(mondayIso: string): { iso: string; date: Date; dayOfWeek: number }[] {
  const monday = parseIsoDate(mondayIso);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = formatIsoDate(d);
    return {
      iso,
      date: d,
      dayOfWeek: i + 1 // 1 = Monday, ..., 7 = Sunday
    };
  });
}

/**
 * Checks if a given ISO date is strictly before today in Tashkent
 */
export function isPastDate(isoDate: string): boolean {
  const today = getTashkentTodayIso();
  return isoDate < today;
}

/**
 * Checks if a given ISO date is today in Tashkent
 */
export function isToday(isoDate: string): boolean {
  const today = getTashkentTodayIso();
  return isoDate === today;
}

/**
 * Compares two "HH:mm" time strings.
 * Returns true if timeA >= timeB
 */
export function isTimeAtOrAfter(timeA: string, timeB: string): boolean {
  const [hA, mA] = timeA.split(':').map(Number);
  const [hB, mB] = timeB.split(':').map(Number);
  if (hA > hB) return true;
  if (hA === hB && mA >= mB) return true;
  return false;
}

/**
 * Determines if cancellation is allowed for a booking
 * Rules:
 * - cancelledAt !== null -> false (already cancelled)
 * - date < today -> false (past session)
 * - date === today && Tashkent time >= bookingCutoff -> false (same-day cutoff passed)
 * - Otherwise -> true
 */
export function canCancelBooking(
  bookingDate: string,
  cancelledAt: string | null | undefined,
  cutoffTime: string = '12:00'
): boolean {
  if (cancelledAt) return false;
  const today = getTashkentTodayIso();
  if (bookingDate < today) return false;
  if (bookingDate === today) {
    const nowTime = getTashkentCurrentTime();
    if (isTimeAtOrAfter(nowTime, cutoffTime)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if booking is permitted for a given date based on CRM horizon rules:
 * - date === today -> Not bookable (sessions booked 1 day ahead)
 * - date < today -> Not bookable (past)
 * - if today is Sunday (7), booking is open for the upcoming week (next Mon..Sat)
 * - if today is Monday..Saturday (1..6), booking is open for tomorrow through Saturday of this week
 * - bookingWeekdays (e.g. "1,2,3,4,5,6") defines open weekdays (Sunday 7 is usually closed)
 */
export function isDateBookable(
  isoDate: string,
  bookingWeekdays: string = '1,2,3,4,5,6',
  holidays: string[] = []
): { bookable: boolean; reason?: string } {
  const today = getTashkentTodayIso();
  if (isoDate < today) {
    return { bookable: false, reason: 'That date has already passed' };
  }
  if (isoDate === today) {
    return {
      bookable: false,
      reason: 'Sessions are booked a day ahead — today can no longer be booked'
    };
  }

  const dow = getIsoDayOfWeek(isoDate);
  const openDays = bookingWeekdays.split(',').map((s) => Number(s.trim()));
  if (!openDays.includes(dow)) {
    return {
      bookable: false,
      reason: "The school isn't open for sessions that day"
    };
  }

  if (holidays.includes(isoDate)) {
    return {
      bookable: false,
      reason: 'That day is a school holiday'
    };
  }

  // Horizon check
  const todayDow = getIsoDayOfWeek(today);
  const thisWeekSunday = getSundayOfWeek(today);

  if (todayDow === 7) {
    // Today is Sunday -> booking is open for NEXT week (Monday to Sunday)
    const nextWeekMonday = parseIsoDate(today);
    nextWeekMonday.setDate(nextWeekMonday.getDate() + 1);
    const nextWeekMondayIso = formatIsoDate(nextWeekMonday);
    const nextWeekSundayIso = getSundayOfWeek(nextWeekMondayIso);

    if (isoDate >= nextWeekMondayIso && isoDate <= nextWeekSundayIso) {
      return { bookable: true };
    }
    return {
      bookable: false,
      reason: 'Next week opens for booking on Sunday'
    };
  } else {
    // Today is Mon..Sat -> booking is open for tomorrow until this week's Sunday/Saturday
    if (isoDate > today && isoDate <= thisWeekSunday) {
      return { bookable: true };
    }
    return {
      bookable: false,
      reason: 'Next week opens for booking on Sunday'
    };
  }
}
