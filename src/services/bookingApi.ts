/**
 * Phoenix-MS CRM Booking API Service Layer
 *
 * Backend CRM is SOURCE OF TRUTH.
 * Safely handles both live CRM API and client-side fallback/mock engine.
 */

import type {
  BookingRecord,
  BookingSlot,
  CreateBookingPayload,
  RescheduleBookingPayload,
  SchoolSettings,
  WeeklyUsage
} from '../types/booking';
import {
  formatIsoDate,
  getDaysOfWeek,
  getMondayOfWeek,
  getSundayOfWeek,
  getTashkentCurrentTime,
  getTashkentTodayIso,
  isDateBookable,
  isPastDate,
  isTimeAtOrAfter,
  isToday
} from '../utils/tashkentTime';

// Default school settings matching CRM defaults
const defaultSchoolSettings: SchoolSettings = {
  bookingCutoff: '12:00',
  autoMissAt: '21:00',
  weeklyRegular: 3,
  weeklyIntensive: 6,
  oneBookingPerDay: true,
  bookingWeekdays: '1,2,3,4,5,6',
  bookingSlotCapacity: 5,
  holidays: []
};

// Initial template slots
const templateSlots = [
  { timeSlotId: 'slot-1', label: 'Ertalabki sessiya (1-smena)', startTime: '09:00', endTime: '10:20', capacity: 5 },
  { timeSlotId: 'slot-2', label: 'Tushki sessiya', startTime: '11:00', endTime: '12:20', capacity: 5 },
  { timeSlotId: 'slot-3', label: 'Peshin sessiyasi', startTime: '14:00', endTime: '15:20', capacity: 5 },
  { timeSlotId: 'slot-4', label: 'Kechki sessiya (2-smena)', startTime: '16:00', endTime: '17:20', capacity: 5 },
  { timeSlotId: 'slot-5', label: 'Qo‘shimcha intensiv sessiya', startTime: '18:00', endTime: '19:20', capacity: 5 }
];

// In-memory CRM state for reliable offline/standalone/mock dev execution
let mockSchoolSettings: SchoolSettings = { ...defaultSchoolSettings };

// Preloaded mock bookings representing student sessions
let mockBookings: BookingRecord[] = [
  {
    id: 101,
    studentId: 1,
    date: '2026-08-19',
    timeSlotId: 'slot-3',
    time: '14:00–15:20',
    purpose: 'Foizlar va murakkab masalalar',
    status: 'booked',
    teacherName: 'Nodira Karimova',
    room: '204-xona',
    slotLabel: 'Peshin sessiyasi',
    createdAt: '2026-08-11T12:00:00Z'
  },
  {
    id: 102,
    studentId: 1,
    date: '2026-08-14',
    timeSlotId: 'slot-4',
    time: '16:00–17:20',
    purpose: 'Kasrlar — maxrajni tenglash bo‘yicha mashq',
    status: 'booked',
    teacherName: 'Nodira Karimova',
    room: '204-xona',
    slotLabel: 'Kechki sessiya (2-smena)',
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 103,
    studentId: 1,
    date: '2026-08-08',
    timeSlotId: 'slot-4',
    time: '16:00–17:20',
    purpose: 'Uy vazifasi yordami va takrorlash',
    status: 'attended',
    teacherName: 'Nodira Karimova',
    room: '204-xona',
    slotLabel: 'Kechki sessiya',
    workedOn: 'Kasrlar, 3–9 misollar ustida ishlandi',
    result: 'pass',
    resultNote: 'Mavzuni to‘liq o‘zlashtirdi',
    createdAt: '2026-08-05T09:30:00Z'
  },
  {
    id: 104,
    studentId: 1,
    date: '2026-08-01',
    timeSlotId: 'slot-3',
    time: '14:00–15:20',
    purpose: 'Imtihonga tayyorgarlik',
    status: 'booked',
    cancelledAt: '2026-07-31T18:00:00Z',
    cancelReason: 'Kasal bo‘lib qolganligi sababli darsga qatnasha olmadi',
    teacherName: 'Sardor Rahimov',
    room: '102-xona',
    slotLabel: 'Peshin sessiyasi',
    createdAt: '2026-07-28T14:00:00Z'
  }
];

// Per-slot booked counts cache for simulated multi-user load
const mockSlotCounts: Record<string, number> = {};

/**
 * Safe JSON request helper that handles non-JSON responses cleanly
 */
async function requestJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    const text = await res.text();
    if (!text || !text.trim()) {
      return null;
    }
    const json = JSON.parse(text);
    if (!res.ok) {
      throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json as T;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message &&
      !err.message.includes('JSON') &&
      !err.message.includes('fetch') &&
      !err.message.includes('network')
    ) {
      throw err; // Re-throw explicit server business error message
    }
    return null;
  }
}

/**
 * Check and apply auto-miss sweep logic
 */
function applyAutoMissSweep(bookings: BookingRecord[]): BookingRecord[] {
  const today = getTashkentTodayIso();
  const nowTime = getTashkentCurrentTime();
  const autoMissTime = mockSchoolSettings.autoMissAt || '21:00';

  return bookings.map((b) => {
    if (b.status === 'booked' && !b.cancelledAt && b.date === today && isTimeAtOrAfter(nowTime, autoMissTime)) {
      return {
        ...b,
        status: 'missed',
        statusSetAt: new Date().toISOString(),
        statusSetBy: 'system-auto-miss'
      };
    }
    return b;
  });
}

/**
 * Fetch School Settings (GET /api/school-settings)
 */
export async function getSchoolSettings(): Promise<SchoolSettings> {
  const data = await requestJson<SchoolSettings>('/api/school-settings');
  if (data) {
    mockSchoolSettings = { ...defaultSchoolSettings, ...data };
    return mockSchoolSettings;
  }
  return mockSchoolSettings;
}

/**
 * Fetch Weekly Usage for student (GET /api/bookings/weekly?date=YYYY-MM-DD)
 */
export async function getWeeklyBookingUsage(date: string, isIntensive: boolean = false): Promise<WeeklyUsage> {
  const data = await requestJson<{ count?: number; limit?: number }>(`/api/bookings/weekly?date=${encodeURIComponent(date)}`);
  if (data) {
    const count = Number(data.count ?? 0);
    const limit = Number(data.limit ?? (isIntensive ? mockSchoolSettings.weeklyIntensive : mockSchoolSettings.weeklyRegular));
    return {
      count,
      limit,
      remaining: Math.max(0, limit - count)
    };
  }

  const monday = getMondayOfWeek(date);
  const sunday = getSundayOfWeek(date);
  const limit = isIntensive ? mockSchoolSettings.weeklyIntensive : mockSchoolSettings.weeklyRegular;

  const activeThisWeek = mockBookings.filter((b) => {
    return b.date >= monday && b.date <= sunday && !b.cancelledAt && b.status !== 'missed';
  });

  const count = activeThisWeek.length;
  return {
    count,
    limit,
    remaining: Math.max(0, limit - count)
  };
}

/**
 * Fetch Available Slots for a given date (GET /api/bookings/slots?date=YYYY-MM-DD)
 */
export async function getBookingSlots(date: string): Promise<BookingSlot[]> {
  const data = await requestJson<BookingSlot[]>(`/api/bookings/slots?date=${encodeURIComponent(date)}`);
  if (data) {
    return data;
  }

  const horizonCheck = isDateBookable(
    date,
    mockSchoolSettings.bookingWeekdays,
    mockSchoolSettings.holidays || []
  );

  const isClosed = !horizonCheck.bookable;

  return templateSlots.map((ts) => {
    const key = `${date}_${ts.timeSlotId}`;
    const studentHasThis = mockBookings.some((b) => b.date === date && b.timeSlotId === ts.timeSlotId && !b.cancelledAt);
    const simulatedExtra = mockSlotCounts[key] || (ts.timeSlotId === 'slot-2' ? 5 : ts.timeSlotId === 'slot-4' ? 4 : 2);
    const count = studentHasThis ? Math.min(ts.capacity, simulatedExtra + 1) : simulatedExtra;
    const full = count >= ts.capacity;

    return {
      timeSlotId: ts.timeSlotId,
      label: ts.label,
      startTime: ts.startTime,
      endTime: ts.endTime,
      count,
      capacity: ts.capacity,
      full,
      closed: isClosed,
      notBookable: isClosed
    };
  });
}

/**
 * Fetch Student's Bookings (GET /api/bookings/mine)
 */
export async function getMyBookings(): Promise<BookingRecord[]> {
  const data = await requestJson<BookingRecord[]>('/api/bookings/mine');
  if (data) {
    mockBookings = applyAutoMissSweep(data);
    return mockBookings;
  }

  mockBookings = applyAutoMissSweep(mockBookings);
  return [...mockBookings].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Create a new Booking (POST /api/bookings)
 */
export async function createBooking(payload: CreateBookingPayload, isIntensive: boolean = false): Promise<BookingRecord> {
  const { date, timeSlotId, purpose } = payload;

  if (!purpose || purpose.trim().length < 3) {
    throw new Error('Purpose must be at least 3 characters');
  }
  if (purpose.trim().length > 300) {
    throw new Error('Purpose cannot exceed 300 characters');
  }

  const data = await requestJson<BookingRecord>('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (data) {
    return data;
  }

  // Simulated CRM Validation Rules:
  const horizonCheck = isDateBookable(
    date,
    mockSchoolSettings.bookingWeekdays,
    mockSchoolSettings.holidays || []
  );

  if (!horizonCheck.bookable) {
    throw new Error(horizonCheck.reason || "The school isn't open for sessions that day");
  }

  // 1. One booking per day rule
  if (mockSchoolSettings.oneBookingPerDay) {
    const hasSameDay = mockBookings.some((b) => b.date === date && !b.cancelledAt);
    if (hasSameDay) {
      throw new Error('One session per day — you already have a booking that day');
    }
  }

  // 2. Weekly limit rule
  const weeklyUsage = await getWeeklyBookingUsage(date, isIntensive);
  if (weeklyUsage.count >= weeklyUsage.limit) {
    throw new Error(`You've reached your weekly limit of ${weeklyUsage.limit} bookings`);
  }

  // 3. Slot Capacity Check
  const slotTemplate = templateSlots.find((s) => s.timeSlotId === timeSlotId);
  if (!slotTemplate) {
    throw new Error("That time slot isn't bookable");
  }
  const key = `${date}_${timeSlotId}`;
  const currentCount = mockSlotCounts[key] || (timeSlotId === 'slot-2' ? 5 : 2);
  if (currentCount >= slotTemplate.capacity) {
    throw new Error('That slot is full');
  }

  // 4. Create new record
  const newBooking: BookingRecord = {
    id: Date.now(),
    studentId: 1,
    date,
    timeSlotId,
    time: `${slotTemplate.startTime}–${slotTemplate.endTime}`,
    purpose: purpose.trim(),
    status: 'booked',
    slotLabel: slotTemplate.label,
    teacherName: 'Nodira Karimova',
    room: '204-xona',
    createdAt: new Date().toISOString()
  };

  mockBookings.unshift(newBooking);
  mockSlotCounts[key] = currentCount + 1;

  return newBooking;
}

/**
 * Cancel a booking (POST /api/bookings/:id/cancel)
 */
export async function cancelBooking(id: number | string, reason: string): Promise<BookingRecord> {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Reason must be at least 10 characters');
  }
  if (reason.trim().length > 300) {
    throw new Error('Reason cannot exceed 300 characters');
  }

  const data = await requestJson<BookingRecord>(`/api/bookings/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });

  if (data) {
    return data;
  }

  // Simulated CRM cancellation logic
  const booking = mockBookings.find((b) => String(b.id) === String(id));
  if (!booking) {
    throw new Error('Booking not found');
  }
  if (booking.cancelledAt) {
    throw new Error('Already cancelled');
  }
  if (isPastDate(booking.date)) {
    throw new Error('Cannot cancel past sessions');
  }
  if (isToday(booking.date)) {
    const nowTime = getTashkentCurrentTime();
    const cutoff = mockSchoolSettings.bookingCutoff || '12:00';
    if (isTimeAtOrAfter(nowTime, cutoff)) {
      throw new Error(`Same-day cancellations close at ${cutoff}`);
    }
  }

  booking.cancelledAt = new Date().toISOString();
  booking.cancelReason = reason.trim();

  // Free slot capacity
  const key = `${booking.date}_${booking.timeSlotId}`;
  if (mockSlotCounts[key] && mockSlotCounts[key] > 0) {
    mockSlotCounts[key] -= 1;
  }

  return booking;
}

/**
 * Reschedule an existing booking (PUT /api/bookings/:id)
 */
export async function rescheduleBooking(
  id: number | string,
  payload: RescheduleBookingPayload,
  isIntensive: boolean = false
): Promise<BookingRecord> {
  const { date, timeSlotId, purpose } = payload;

  if (!purpose || purpose.trim().length < 3) {
    throw new Error('Purpose must be at least 3 characters');
  }
  if (purpose.trim().length > 300) {
    throw new Error('Purpose cannot exceed 300 characters');
  }

  const data = await requestJson<BookingRecord>(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (data) {
    return data;
  }

  // Simulated CRM Reschedule logic
  const booking = mockBookings.find((b) => String(b.id) === String(id));
  if (!booking) {
    throw new Error('Booking not found');
  }
  if (booking.cancelledAt || booking.status !== 'booked') {
    throw new Error('This booking can no longer be changed');
  }

  // Validate target date with horizon
  const horizonCheck = isDateBookable(
    date,
    mockSchoolSettings.bookingWeekdays,
    mockSchoolSettings.holidays || []
  );

  if (!horizonCheck.bookable) {
    throw new Error(horizonCheck.reason || "The school isn't open for sessions that day");
  }

  // Check one booking per day if moving to another date
  if (mockSchoolSettings.oneBookingPerDay && date !== booking.date) {
    const hasSameDay = mockBookings.some((b) => b.date === date && String(b.id) !== String(id) && !b.cancelledAt);
    if (hasSameDay) {
      throw new Error('One session per day — you already have a booking that day');
    }
  }

  // Target Slot Capacity
  const slotTemplate = templateSlots.find((s) => s.timeSlotId === timeSlotId);
  if (!slotTemplate) {
    throw new Error("That time slot isn't bookable");
  }

  const oldKey = `${booking.date}_${booking.timeSlotId}`;
  const newKey = `${date}_${timeSlotId}`;

  const currentNewCount = mockSlotCounts[newKey] || (timeSlotId === 'slot-2' ? 5 : 2);
  if (currentNewCount >= slotTemplate.capacity && oldKey !== newKey) {
    throw new Error('That slot is full');
  }

  // Adjust counts
  if (mockSlotCounts[oldKey] && mockSlotCounts[oldKey] > 0) {
    mockSlotCounts[oldKey] -= 1;
  }
  mockSlotCounts[newKey] = currentNewCount + 1;

  booking.date = date;
  booking.timeSlotId = timeSlotId;
  booking.time = `${slotTemplate.startTime}–${slotTemplate.endTime}`;
  booking.purpose = purpose.trim();
  booking.slotLabel = slotTemplate.label;

  return booking;
}
