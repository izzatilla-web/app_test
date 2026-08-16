import React, { useRef, useState } from 'react';
import { CalendarPlusIcon, ChevronRightIcon, ClockIcon, MapPinIcon, UserIcon, PlusIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { NewBookingSheet } from './NewBookingSheet';
import { CancelBookingSheet } from './CancelBookingSheet';
import { t } from '../strings';
import { longDate, haptic, ASSETS_3D } from '../tokens';
import { bookings as seedBookings, weeklyLimit, student } from '../mockData';
import type { Booking } from '../mockData';
import { useUI } from '../ui';

export function StudentBookings({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const [list, setList] = useState<Booking[]>(seedBookings);

  const empty = dataState === 'empty';
  const upcoming = empty ? [] : list.filter((b) => b.status === 'booked');
  const past = empty ? [] : list.filter((b) => b.status !== 'booked');
  const left = weeklyLimit.limit - weeklyLimit.used;
  const quotaSpent = left <= 0;

  function cancel(id: number) {
    setList((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: 'cancelled', cancelReason: 'Foydalanuvchi bekor qildi' } : b
      )
    );
  }

  function openNew() {
    haptic('light');
    ui.openSheet({ key: 'new-booking', detent: 'large', node: <NewBookingSheet /> });
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
            className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)'
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 font-sans text-xs font-semibold text-white backdrop-blur-md">
                  <ClockIcon size={12} />
                  Bugun · 14:00
                </span>

                <h3 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-white">
                  Matematika
                </h3>
                <p className="mt-0.5 font-sans text-sm font-medium text-blue-100">
                  {student.group}
                </p>

                <p className="mt-3 font-sans text-xs text-blue-200">
                  {student.teacher} · 204-xona
                </p>
              </div>

              {/* 3D Schedule Desk — Transparent PNG directly on the card */}
              <div className="relative -my-1 -mr-1 flex h-24 w-24 shrink-0 items-center justify-center">
                <img
                  src={ASSETS_3D.schedule3d}
                  alt="Dars jadvali"
                  className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
                />
              </div>
            </div>
          </div>

          {/* Quota Tracker & Action */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-xs font-medium text-mutedfg">
                  Haftalik dars limiti
                </p>
                <p className="mt-0.5 font-sans text-sm font-bold text-foreground">
                  {t.quotaLine(left, weeklyLimit.limit)}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-sans text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Haftalik
              </span>
            </div>

            {/* Segmented indicator */}
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: weeklyLimit.limit }, (_, i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      i < weeklyLimit.used
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--muted))'
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={quotaSpent}
              onClick={openNew}
              className="mt-3.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 font-sans text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-blue-700"
            >
              <PlusIcon size={15} strokeWidth={2.4} />
              {t.newBooking}
            </button>

            {quotaSpent && (
              <p className="mt-2 text-center font-sans text-xs text-mutedfg">
                {t.quotaSpent}
              </p>
            )}
          </div>

          {/* Bookings List */}
          {upcoming.length === 0 && past.length === 0 ? (
            <EmptyState
              icon={CalendarPlusIcon}
              title={t.emptyBookingsTitle}
              body={t.emptyBookingsBody}
              action={
                <button
                  type="button"
                  onClick={openNew}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 font-sans text-xs font-bold text-white shadow-sm"
                >
                  <PlusIcon size={15} />
                  {t.newBooking}
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              {/* Upcoming Consultations */}
              {upcoming.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.upcomingHeader}
                  </h3>
                  {upcoming.map((booking) => (
                    <div
                      key={booking.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <SwipeRow
                        disabled={booking.locked}
                        onCancel={() =>
                          ui.openSheet({
                            key: `cancel-${booking.id}`,
                            detent: 'medium',
                            node: (
                              <CancelBookingSheet booking={booking} onCancelled={cancel} />
                            )
                          })
                        }
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-sans text-sm font-semibold tabular-nums text-foreground">
                              {longDate(booking.date)} · {booking.time}
                            </p>
                            {!booking.locked && (
                              <ChevronRightIcon size={16} className="text-mutedfg" />
                            )}
                          </div>
                          <p className="mt-0.5 font-sans text-xs text-mutedfg">
                            {booking.purpose}
                          </p>
                          {booking.locked && (
                            <p className="mt-1 font-sans text-xs font-medium text-amber-600 dark:text-amber-400">
                              {t.bookingLocked}
                            </p>
                          )}
                        </div>
                      </SwipeRow>
                    </div>
                  ))}
                </div>
              )}

              {/* Past Consultations */}
              {past.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.pastHeader}
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 divide-y divide-hairline">
                    {past.map((booking) => (
                      <div key={booking.id} className="p-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-sans text-xs font-semibold tabular-nums text-foreground">
                              {longDate(booking.date)} · {booking.time}
                            </p>
                            <p className="mt-0.5 font-sans text-xs text-mutedfg">
                              {booking.purpose}
                            </p>
                          </div>
                          <StatusPill
                            tone={
                              booking.status === 'attended'
                                ? 'green'
                                : booking.status === 'missed'
                                ? 'red'
                                : 'grey'
                            }
                            label={
                              booking.status === 'attended'
                                ? t.bookingAttended
                                : booking.status === 'missed'
                                ? t.bookingMissed
                                : t.bookingCancelled
                            }
                          />
                        </div>

                        {booking.teacherNote && (
                          <p className="mt-2 rounded-lg bg-slate-50 p-2 font-sans text-xs italic text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                            «{booking.teacherNote}»
                          </p>
                        )}
                        {booking.cancelReason && (
                          <p className="mt-2 font-sans text-xs italic text-mutedfg">
                            «{booking.cancelReason}»
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ScrollScreen>
  );
}

function SwipeRow({
  children,
  onCancel,
  disabled
}: {
  children: React.ReactNode;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [x, setX] = useState(0);
  const start = useRef<number | null>(null);

  return (
    <div className="relative overflow-hidden">
      {!disabled && (
        <button
          type="button"
          onClick={() => {
            setX(0);
            onCancel();
          }}
          className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-600 font-sans text-xs font-bold text-white"
        >
          {t.swipeCancel}
        </button>
      )}
      <div
        onPointerDown={(e) => {
          if (disabled) return;
          start.current = e.clientX - x;
        }}
        onPointerMove={(e) => {
          if (start.current === null) return;
          const next = Math.min(0, Math.max(-96, e.clientX - start.current));
          setX(next);
        }}
        onPointerUp={() => {
          if (start.current === null) return;
          start.current = null;
          setX(x < -48 ? -96 : 0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setX(0);
        }}
        className="relative flex touch-pan-y items-start gap-3 bg-card p-3.5 transition-transform duration-150"
        style={{
          transform: `translateX(${x}px)`,
          transition: start.current === null ? 'transform 200ms ease-out' : undefined
        }}
      >
        {children}
      </div>
    </div>
  );
}