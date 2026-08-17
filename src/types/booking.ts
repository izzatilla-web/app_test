/**
 * Phoenix-MS CRM Booking Data Contracts & Types
 * Source of Truth: CRM Backend API
 */

export interface SchoolSettings {
  bookingCutoff: string; // e.g. "12:00"
  autoMissAt: string; // e.g. "21:00"
  weeklyRegular: number; // e.g. 3
  weeklyIntensive: number; // e.g. 6
  oneBookingPerDay: boolean; // default: true
  bookingWeekdays: string; // e.g. "1,2,3,4,5,6" (Monday = 1, Saturday = 6)
  bookingSlotCapacity: number; // default: 5
  holidays?: string[]; // e.g. ["2026-09-01", "2026-10-01"]
}

export type BookingStatus = 'booked' | 'attended' | 'missed';

export interface BookingRecord {
  id: number | string;
  studentId: number;
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  time: string; // e.g. "09:00–10:20" or "09:00"
  purpose: string;
  status: BookingStatus;
  statusSetBy?: string | null;
  statusSetByUser?: string | null;
  statusSetAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt?: string;
  workedOn?: string | null;
  result?: 'pass' | 'conditional' | 'fail' | null;
  resultNote?: string | null;
  overrideReason?: string | null;
  teacherName?: string;
  room?: string;
  slotLabel?: string;
}

export interface BookingSlot {
  timeSlotId: string;
  label: string;
  startTime: string;
  endTime?: string;
  count: number;
  capacity: number;
  full: boolean;
  closed?: boolean;
  notBookable?: boolean;
  clash?: boolean;
}

export interface WeeklyUsage {
  count: number;
  limit: number;
  remaining: number;
}

export interface CreateBookingPayload {
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  purpose: string;
}

export interface RescheduleBookingPayload {
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  purpose: string;
}

export interface CancelBookingPayload {
  reason: string;
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}
