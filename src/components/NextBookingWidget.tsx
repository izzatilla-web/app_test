import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRightIcon,
  PlusIcon
} from 'lucide-react';
import { useUI } from '../ui';
import { haptic } from '../tokens';
import { t } from '../strings';
import { student, TODAY } from '../mockData';
import { getMyBookings } from '../services/bookingApi';
import type { BookingRecord } from '../types/booking';
import {
  getTashkentTodayIso,
  parseIsoDate
} from '../utils/tashkentTime';
import { NewBookingSheet } from '../screens/NewBookingSheet';
import { RescheduleBookingSheet } from '../screens/RescheduleBookingSheet';
import { useLevelIdentity } from '../useLevelIdentity';

const UZ_MONTHS_SHORT = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
  'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
];

export function NextBookingWidget() {
  const ui = useUI();
  const { next: nextLevel } = useLevelIdentity();
  const todayIso = useMemo(() => getTashkentTodayIso() || TODAY, []);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);

  // The student's own bookings, from Phoenix-MS.
  useEffect(() => {
    let active = true;
    getMyBookings()
      .then((data) => {
        if (active) {
          setAllBookings(data);
        }
      })
      .catch(() => {
        /* Phoenix-MS is the only source of a booking. When it cannot be reached
           the widget shows nothing — inventing sessions here would tell a
           student they have a lesson the school has never heard of. */
        if (active) setAllBookings([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Find next upcoming active booking
  const upcomingBookings = useMemo(() => {
    return allBookings
      .filter((b) => b.status === 'booked' && !b.cancelledAt && b.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allBookings, todayIso]);

  const nextBooking = upcomingBookings[0];

  // Relative day badge (e.g. Bugun, Ertaga, 3 kundan keyin)
  const relativeBadge = useMemo(() => {
    if (!nextBooking) return null;
    if (nextBooking.date === todayIso) {
      return { text: 'Bugun', tone: 'green' };
    }
    const dToday = parseIsoDate(todayIso);
    const dBook = parseIsoDate(nextBooking.date);
    const diffTime = dBook.getTime() - dToday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return { text: 'Ertaga', tone: 'blue' };
    if (diffDays > 1 && diffDays <= 7) return { text: `${diffDays} kundan keyin`, tone: 'indigo' };
    return { text: 'Rejalashtirilgan', tone: 'slate' };
  }, [nextBooking, todayIso]);

  // Parse next booking date details
  const bookingDateObj = useMemo(() => {
    if (!nextBooking) return null;
    return parseIsoDate(nextBooking.date);
  }, [nextBooking]);

  function handleOpenBookings() {
    haptic('light');
    ui.goToTab(4);
  }

  function handleNewBooking(e: React.MouseEvent) {
    e.stopPropagation();
    haptic('light');
    /* Phoenix-MS keeps the open weak points on the student's own record, and
       shows them to the student but never to a parent — so the purpose is
       pre-filled from the CRM's words, not a mock topic. */
    const firstWeak = ui.activeChild?.weakPoints.find((w) => !w.closedAt);
    ui.openSheet({
      key: 'new-booking-quick',
      detent: 'large',
      node: (
        <NewBookingSheet
          initialPurpose={firstWeak ? `${firstWeak.topic} — ${firstWeak.note.toLowerCase()}` : undefined}
          onSuccess={() => {
            getMyBookings().then(setAllBookings);
          }}
        />
      )
    });
  }

  function handleReschedule(e: React.MouseEvent) {
    e.stopPropagation();
    if (!nextBooking) return;
    haptic('light');
    ui.openSheet({
      key: `reschedule-${nextBooking.id}`,
      detent: 'large',
      node: (
        <RescheduleBookingSheet
          booking={nextBooking}
          onRescheduled={(updated) => {
            setAllBookings((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
          }}
        />
      )
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SCENARIO 1: UPCOMING BOOKING EXISTS (Pure Apple iOS Widget)
  // ─────────────────────────────────────────────────────────────
  if (nextBooking && bookingDateObj) {
    const monthIndex = bookingDateObj.getMonth();
    const monthShort = UZ_MONTHS_SHORT[monthIndex]?.toUpperCase() || 'AVG';
    const dayNum = bookingDateObj.getDate();
    const dowIndex = (bookingDateObj.getDay() + 6) % 7;
    const weekdayName = t.weekdaysLong[dowIndex] || 'Juma';

    return (
      <div
        onClick={handleOpenBookings}
        className="group relative cursor-pointer rounded-3xl bg-slate-100/75 p-4 sm:p-5 transition-all duration-200 active:scale-[0.99] dark:bg-slate-800/50"
      >
        {/* ── 1. Top Bar: Minimal Caption & Relative Badge ── */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.6px] text-mutedfg dark:text-slate-400">
            Keyingi yozilish
          </span>

          <div className="flex items-center gap-2">
            {relativeBadge && (
              <span
                className={[
                  'rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold tabular-nums',
                  relativeBadge.tone === 'green'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : relativeBadge.tone === 'blue'
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                ].join(' ')}
              >
                {relativeBadge.text}
              </span>
            )}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors group-hover:text-foreground dark:text-slate-500">
              <ChevronRightIcon size={15} strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* ── 2. Hero Content: Clean Apple Calendar Icon + Big Time + Topic ── */}
        <div className="mt-3.5 flex items-center gap-3.5 sm:gap-4">
          {/* Apple Calendar Square Badge - Crisp & Uncut */}
          <div className="flex h-[66px] w-[58px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-2xl bg-white pb-1 shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
            {/* Red Top Header */}
            <div className="flex h-5 w-full items-center justify-center bg-rose-500 text-center">
              <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-white">
                {monthShort}
              </span>
            </div>
            {/* Date Number */}
            <span className="font-display text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">
              {dayNum}
            </span>
            {/* Day of Week */}
            <span className="font-sans text-[11px] font-medium leading-none text-slate-500 capitalize dark:text-slate-400">
              {weekdayName.slice(0, 4)}
            </span>
          </div>

          {/* Session Details: Time & Topic */}
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-bold tabular-nums text-foreground">
              {nextBooking.time}
            </div>

            <p className="mt-1 line-clamp-2 font-sans text-sm sm:text-base font-semibold leading-snug text-foreground/90">
              {nextBooking.purpose || 'Qo‘shimcha dars konsultatsiyasi'}
            </p>
          </div>
        </div>

        {/* ── 3. Clean Apple Typography Subtitle (No div boxes, no icons) ── */}
        <p className="mt-3 font-sans text-xs text-mutedfg leading-relaxed">
          {nextLevel
            ? `Ushbu dars orqali mavzu to‘liq mustahkamlanib, ${nextLevel.code} darajaga erishish tezlashadi.`
            : 'Ushbu dars orqali mavzular eng yuqori darajada mustahkamlanadi.'}
        </p>

        {/* ── 4. Action Buttons Footer ── */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-200/50 pt-2.5 dark:border-slate-700/40">
          <button
            type="button"
            onClick={handleReschedule}
            className="rounded-xl px-2.5 py-1.5 font-sans text-xs font-semibold text-slate-600 transition-colors hover:bg-white/80 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Vaqtni o'zgartirish
          </button>

          <button
            type="button"
            onClick={handleNewBooking}
            className="flex items-center gap-1 rounded-xl bg-blue-500/10 px-3 py-1.5 font-sans text-xs font-bold text-blue-600 transition-colors hover:bg-blue-500/20 active:scale-95 dark:bg-blue-400/15 dark:text-blue-300 dark:hover:bg-blue-400/25"
          >
            <PlusIcon size={14} strokeWidth={2.4} />
            <span>Yana yozilish</span>
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SCENARIO 2: NO UPCOMING BOOKING (Minimal Apple Booking CTA)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleNewBooking}
      className="group relative cursor-pointer rounded-3xl bg-slate-100/70 p-4 sm:p-5 transition-all duration-200 active:scale-[0.99] dark:bg-slate-800/50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="font-display text-base font-bold text-foreground">
            Qo‘shimcha darsga yozilish
          </span>
          <p className="mt-0.5 line-clamp-2 font-sans text-xs text-mutedfg">
            Qiyin mavzularni mustahkamlash uchun dars band qiling.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewBooking}
          className="shrink-0 flex items-center gap-1 rounded-2xl bg-blue-600 px-3.5 py-2 font-sans text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          <PlusIcon size={14} strokeWidth={2.4} />
          <span>Yozilish</span>
        </button>
      </div>
    </div>
  );
}
