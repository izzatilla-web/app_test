/**
 * Phoenix-MS support-session booking.
 *
 * The CRM owns every rule. This file does not re-implement any of them — it
 * sends what the family asked for and shows what Phoenix-MS answered. The
 * server refuses, in its own words, when:
 *
 *   · the date has passed, or is today  ("booked a day ahead")
 *   · the date is past this week        ("next week opens on Sunday")
 *   · the school is closed that weekday, or it is a holiday
 *   · the student already has a session that day
 *   · the weekly allowance is used up
 *   · the slot is full, or clashes with their own group class
 *
 * Cancelling has its own rules: never in the past, and same-day cancelling
 * closes at the school's cutoff hour. A reason of at least 10 characters is
 * required — the server checks that too.
 *
 * There is no mock fallback here. A failure surfaces as ApiError so the screen
 * can show the CRM's message rather than a plausible fiction.
 */
import { ApiError, apiFetch } from './http';
import type {
  BookingRecord,
  BookingSlot,
  CreateBookingPayload,
  RescheduleBookingPayload,
  SchoolSettings,
  WeeklyUsage } from
'../types/booking';

/* ── What Phoenix-MS actually sends ─────────────────────────────── */

/** BookingRow — the booking plus the labels the CRM joins onto it. */
interface CrmBooking {
  id: number;
  studentId: number;
  date: string;
  timeSlotId: number;
  purpose: string;
  status: string;
  statusSetBy: string | null;
  statusSetAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  workedOn: string;
  result: string;
  resultNote: string;
  overrideReason: string;
  slotLabel: string;
  startTime: string;
  markedByName: string | null;
  mainTeacherName: string | null;
}

/** SlotOccupancy — already filtered to bookable, open slots by the CRM. */
interface CrmSlot {
  timeSlotId: number;
  label: string;
  startTime: string;
  count: number;
  capacity: number;
  full: boolean;
}

/* ── Mapping ────────────────────────────────────────────────────── */

function toBookingRecord(row: CrmBooking): BookingRecord {
  return {
    id: row.id,
    studentId: row.studentId,
    date: row.date,
    timeSlotId: String(row.timeSlotId),
    time: row.slotLabel,
    slotLabel: row.slotLabel,
    purpose: row.purpose,
    status: (row.status as BookingRecord['status']) ?? 'booked',
    statusSetBy: row.statusSetBy,
    statusSetAt: row.statusSetAt,
    cancelledAt: row.cancelledAt,
    cancelReason: row.cancelReason,
    createdAt: row.createdAt,
    workedOn: row.workedOn || null,
    resultNote: row.resultNote || null,
    overrideReason: row.overrideReason || null,
    /* Whose student this is — the CRM names the main teacher, not the support
       teacher who will take the session (that is decided on the day). */
    teacherName: row.mainTeacherName ?? undefined
  };
}

function toBookingSlot(slot: CrmSlot): BookingSlot {
  return {
    timeSlotId: String(slot.timeSlotId),
    label: slot.label,
    startTime: slot.startTime,
    count: slot.count,
    capacity: slot.capacity,
    full: slot.full
  };
}

/* ── Reads ──────────────────────────────────────────────────────── */

/**
 * Phoenix-MS sends a family only the two hours their booking screen has to
 * obey — the cutoff and the auto-miss time. The remaining fields below are the
 * school's published defaults, used to grey out days in the date strip; the
 * server stays the authority and refuses anything they get wrong.
 */
export async function getSchoolSettings(): Promise<SchoolSettings> {
  const portal = await apiFetch<{ bookingCutoff: string; autoMissAt: string }>(
    '/api/school-settings'
  );
  return {
    bookingCutoff: portal.bookingCutoff,
    autoMissAt: portal.autoMissAt,
    // Not sent to the portal — see the note above.
    weeklyRegular: 3,
    weeklyIntensive: 6,
    oneBookingPerDay: true,
    bookingWeekdays: '1,2,3,4,5,6',
    bookingSlotCapacity: 20,
    holidays: []
  };
}

export async function getMyBookings(): Promise<BookingRecord[]> {
  const rows = await apiFetch<CrmBooking[]>('/api/bookings/mine');
  return rows.map(toBookingRecord);
}

export async function getBookingSlots(date: string): Promise<BookingSlot[]> {
  const rows = await apiFetch<CrmSlot[]>(
    `/api/bookings/slots?date=${encodeURIComponent(date)}`
  );
  return rows.map(toBookingSlot);
}

/**
 * The weekly allowance for the week the date falls in. The CRM decides the
 * limit from the student's own type (regular or intensive) — nothing is passed
 * from here, so a family cannot ask for someone else's allowance.
 */
export async function getWeeklyBookingUsage(date: string): Promise<WeeklyUsage> {
  const usage = await apiFetch<{ count: number; limit: number }>(
    `/api/bookings/weekly?date=${encodeURIComponent(date)}`
  );
  return {
    count: usage.count,
    limit: usage.limit,
    remaining: Math.max(0, usage.limit - usage.count)
  };
}

/* ── Writes ─────────────────────────────────────────────────────── */

export async function createBooking(payload: CreateBookingPayload): Promise<BookingRecord> {
  const row = await apiFetch<CrmBooking>('/api/bookings', {
    method: 'POST',
    body: {
      date: payload.date,
      timeSlotId: Number(payload.timeSlotId),
      purpose: payload.purpose.trim()
    }
  });
  return toBookingRecord(row);
}

export async function rescheduleBooking(
id: number | string,
payload: RescheduleBookingPayload)
: Promise<BookingRecord> {
  const row = await apiFetch<CrmBooking>(`/api/bookings/${id}`, {
    method: 'PUT',
    body: {
      date: payload.date,
      timeSlotId: Number(payload.timeSlotId),
      purpose: payload.purpose.trim()
    }
  });
  return toBookingRecord(row);
}

/** Phoenix-MS answers 200 with no body; the caller re-reads the list. */
export async function cancelBooking(id: number | string, reason: string): Promise<void> {
  await apiFetch<null>(`/api/bookings/${id}/cancel`, {
    method: 'POST',
    body: { reason: reason.trim() }
  });
}

/** A message to show for a failed booking call — the CRM's own words. */
export function bookingErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return fallback;
    return err.message || fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
