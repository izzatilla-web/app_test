import { useState } from 'react';
import {
  ClockIcon,
  PlusIcon
} from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { NewBookingSheet } from './NewBookingSheet';
import { CancelBookingSheet } from './CancelBookingSheet';
import { t } from '../strings';
import { ASSETS_3D, haptic } from '../tokens';
import { student, bookings as initialBookings } from '../mockData';
import type { Booking } from '../mockData';
import { useUI } from '../ui';

export function StudentBookings({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const [bookingList, setBookingList] = useState<Booking[]>(initialBookings);

  function openNewBooking() {
    haptic('light');
    ui.openSheet({
      key: 'new-booking',
      detent: 'large',
      node: <NewBookingSheet />
    });
  }

  function openCancelBooking(booking: Booking) {
    haptic('light');
    ui.openSheet({
      key: `cancel-${booking.id}`,
      detent: 'medium',
      node: (
        <CancelBookingSheet
          booking={booking}
          onCancelled={(id) => {
            setBookingList((prev) => prev.filter((b) => b.id !== id));
            ui.closeSheet();
            ui.toast("Dars bekor qilindi", "warning");
          }}
        />
      )
    });
  }

  return (
    <ScrollScreen
      title={t.tabBookings}
      subtitle={t.bookingsSubtitle}
      scrollKey="student-bookings"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
    >
      {dataState === 'loading' ? (
        <ScreenSkeleton />
      ) : dataState === 'error' ? (
        <ErrorState onRetry={() => undefined} />
      ) : (
        <div className="space-y-5 px-4 pb-24">
          {/* Clean, Light, Friendly Hero Upcoming Lesson Card */}
          <div
            className="relative min-h-[142px] overflow-hidden rounded-2xl p-5 text-white shadow-sm"
            style={{
              background: 'linear-gradient(115deg, #1D4ED8 0%, #2563EB 35%, #3B82F6 65%, #93C5FD 100%)'
            }}
          >
            {/* Soft ambient inner glow on left */}
            <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />

            {/* Luminous soft highlight on right behind 3D asset */}
            <div className="pointer-events-none absolute -right-2 -bottom-2 h-40 w-40 rounded-full bg-white/25 blur-2xl" />

            <div className="relative z-10 flex min-w-0 flex-1 flex-col pr-28">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-0.5 font-sans text-xs font-semibold text-white backdrop-blur-md">
                <ClockIcon size={12} />
                Bugun · 14:00
              </span>

              <h3 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-white">
                Matematika
              </h3>
              <p className="mt-0.5 font-sans text-sm font-medium text-white/90">
                {student.group}
              </p>

              <p className="mt-2.5 font-sans text-xs text-white/80">
                {student.teacher} · 204-xona
              </p>
            </div>

            {/* 3D Schedule Desk — Position absolute with static rotation */}
            <div
              className="pointer-events-none absolute -bottom-3 -right-2 z-10 flex h-32 w-32 shrink-0 items-center justify-center"
              style={{ transform: 'rotate(4deg)' }}
            >
              <img
                src={ASSETS_3D.schedule3d}
                alt="Dars jadvali"
                className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
              />
            </div>
          </div>

          {/* Bookings Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Rejalashtirilgan darslar
              </h3>
              <button
                type="button"
                onClick={openNewBooking}
                className="flex items-center gap-1 font-sans text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <PlusIcon size={14} />
                Yangi band qilish
              </button>
            </div>

            <div className="space-y-2.5">
              {bookingList.length > 0 ? (
                bookingList.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs font-semibold text-mutedfg">
                          {b.date} · {b.time}
                        </span>
                        <span
                          className={[
                            'rounded-full px-2 py-0.5 font-sans text-[10px] font-bold',
                            b.status === 'attended' || b.status === 'booked'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          ].join(' ')}
                        >
                          {b.status === 'attended'
                            ? 'Qatnashgan'
                            : b.status === 'booked'
                            ? 'Band qilingan'
                            : 'Bekor qilingan'}
                        </span>
                      </div>

                      <p className="mt-1 font-sans text-sm font-bold text-foreground">
                        {b.purpose || 'Qo\'shimcha dars'}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-mutedfg">
                        {student.teacher} · 204-xona
                      </p>
                    </div>

                    {b.status === 'booked' && (
                      <button
                        type="button"
                        onClick={() => openCancelBooking(b)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 font-sans text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Bekor qilish
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                  <p className="font-sans text-xs text-mutedfg">
                    Rejalashtirilgan qo'shimcha darslar mavjud emas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ScrollScreen>
  );
}
