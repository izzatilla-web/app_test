import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheckIcon,
  CalendarIcon,
  CalendarOffIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon
} from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ScreenSkeleton, Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { SegmentedControl } from '../components/SegmentedControl';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { NewBookingSheet } from './NewBookingSheet';
import { CancelBookingSheet } from './CancelBookingSheet';
import { RescheduleBookingSheet } from './RescheduleBookingSheet';
import { t } from '../strings';
import { haptic, longDate } from '../tokens';
import { student } from '../mockData';
import { useUI } from '../ui';
import type { BookingRecord, BookingSlot, SchoolSettings, WeeklyUsage } from '../types/booking';
import {
  getBookingSlots,
  getMyBookings,
  getSchoolSettings,
  getWeeklyBookingUsage
} from '../services/bookingApi';
import {
  canCancelBooking,
  formatIsoDate,
  getDaysOfWeek,
  getMondayOfWeek,
  getTashkentNow,
  getTashkentTodayIso,
  isDateBookable,
  parseIsoDate
} from '../utils/tashkentTime';

type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled';

export function StudentBookings({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;

  // Active view tab: 0 = Yozilish (Book), 1 = Mening darslarim (My Bookings)
  const [tabIndex, setTabIndex] = useState(0);
  const [filter, setFilter] = useState<BookingFilter>('all');

  const todayIso = useMemo(() => getTashkentTodayIso(), []);

  // School settings
  const [settings, setSettings] = useState<SchoolSettings>({
    bookingCutoff: '12:00',
    autoMissAt: '21:00',
    weeklyRegular: 3,
    weeklyIntensive: 6,
    oneBookingPerDay: true,
    bookingWeekdays: '1,2,3,4,5,6',
    bookingSlotCapacity: 5,
    holidays: []
  });

  // Week selection for booking flow
  const [weekMondayIso, setWeekMondayIso] = useState<string>(() => {
    const tashkentNow = getTashkentNow();
    if (tashkentNow.getDay() === 0) {
      const nextMon = new Date(tashkentNow);
      nextMon.setDate(tashkentNow.getDate() + 1);
      return formatIsoDate(nextMon);
    }
    return getMondayOfWeek(todayIso);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Data states
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsage | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const weekDays = useMemo(() => getDaysOfWeek(weekMondayIso), [weekMondayIso]);

  // Load school settings and student bookings
  const reloadData = useCallback(async () => {
    try {
      setHasError(false);
      setBookingsLoading(true);

      const [loadedSettings, loadedBookings] = await Promise.all([
        getSchoolSettings(),
        getMyBookings()
      ]);

      setSettings(loadedSettings);
      setBookings(loadedBookings);
    } catch {
      setHasError(true);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Set default bookable date in week
  useEffect(() => {
    if (!selectedDate) {
      const firstAvailable = weekDays.find((d) => {
        const check = isDateBookable(d.iso, settings.bookingWeekdays, settings.holidays);
        return check.bookable;
      });
      if (firstAvailable) {
        setSelectedDate(firstAvailable.iso);
      }
    }
  }, [selectedDate, weekDays, settings]);

  // Fetch slots and weekly usage whenever selected date changes
  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    setSlotsLoading(true);
    setWeeklyLoading(true);

    Promise.all([
      getBookingSlots(selectedDate),
      getWeeklyBookingUsage(selectedDate)
    ])
      .then(([slotsData, usageData]) => {
        if (isMounted) {
          setSlots(slotsData);
          setWeeklyUsage(usageData);

          if (selectedSlotId) {
            const found = slotsData.find((s) => s.timeSlotId === selectedSlotId);
            if (!found || found.full || found.closed) {
              setSelectedSlotId(null);
            }
          }
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) {
          setSlotsLoading(false);
          setWeeklyLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  function shiftWeek(delta: number) {
    haptic('light');
    const curr = parseIsoDate(weekMondayIso);
    curr.setDate(curr.getDate() + delta * 7);
    const nextMon = formatIsoDate(curr);
    setWeekMondayIso(nextMon);
    setSelectedDate(null);
    setSelectedSlotId(null);
  }

  // Sheets handling
  function openNewBookingSheet(prefilledDate?: string, prefilledSlotId?: string) {
    haptic('light');
    ui.openSheet({
      key: 'new-booking-sheet',
      detent: 'large',
      node: (
        <NewBookingSheet
          initialDate={prefilledDate || selectedDate || undefined}
          initialSlotId={prefilledSlotId || selectedSlotId || undefined}
          onSuccess={() => {
            reloadData();
            if (selectedDate) {
              getBookingSlots(selectedDate).then(setSlots);
              getWeeklyBookingUsage(selectedDate).then(setWeeklyUsage);
            }
          }}
        />
      )
    });
  }

  function openCancelSheet(booking: BookingRecord) {
    haptic('light');
    ui.openSheet({
      key: `cancel-${booking.id}`,
      detent: 'medium',
      node: (
        <CancelBookingSheet
          booking={booking}
          bookingCutoff={settings.bookingCutoff}
          onCancelled={(id) => {
            // Update local state immediately
            setBookings((prev) =>
              prev.map((b) =>
                b.id === id
                  ? { ...b, cancelledAt: new Date().toISOString(), cancelReason: 'Bekor qilingan' }
                  : b
              )
            );
            reloadData();
            if (selectedDate) {
              getBookingSlots(selectedDate).then(setSlots);
              getWeeklyBookingUsage(selectedDate).then(setWeeklyUsage);
            }
          }}
        />
      )
    });
  }

  function openRescheduleSheet(booking: BookingRecord) {
    haptic('light');
    ui.openSheet({
      key: `reschedule-${booking.id}`,
      detent: 'large',
      node: (
        <RescheduleBookingSheet
          booking={booking}
          onRescheduled={(updated) => {
            // Update local state immediately
            setBookings((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
            reloadData();
            if (selectedDate) {
              getBookingSlots(selectedDate).then(setSlots);
              getWeeklyBookingUsage(selectedDate).then(setWeeklyUsage);
            }
          }}
        />
      )
    });
  }

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === 'upcoming') {
        return b.status === 'booked' && !b.cancelledAt && b.date >= todayIso;
      }
      if (filter === 'past') {
        return (
          b.status === 'attended' ||
          b.status === 'missed' ||
          (b.date < todayIso && !b.cancelledAt)
        );
      }
      if (filter === 'cancelled') {
        return !!b.cancelledAt;
      }
      return true;
    });
  }, [bookings, filter, todayIso]);

  const remainingWeekly = weeklyUsage ? weeklyUsage.remaining : 1;
  const isWeeklyLimitReached = weeklyUsage ? weeklyUsage.count >= weeklyUsage.limit : false;

  return (
    <ScrollScreen
      title={t.tabBookings}
      subtitle={t.bookingsSubtitle}
      scrollKey="student-bookings"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
        <div className="space-y-2.5 px-4 pb-2 pt-1">
          <SegmentedControl
            options={[t.bookingTabBook, `${t.bookingTabMine} (${bookings.length})`]}
            value={tabIndex}
            onChange={(idx) => {
              haptic('light');
              setTabIndex(idx);
            }}
          />

          {tabIndex === 0 && (
            <div className="flex items-center justify-between px-1 font-sans text-footnote font-medium tabular-nums text-mutedfg">
              <span>
                {weeklyLoading
                  ? '...'
                  : isWeeklyLimitReached
                  ? t.weeklyUsageLimitReached
                  : t.weeklyUsageRemaining(remainingWeekly)}
              </span>
              {weeklyUsage && (
                <span className="font-semibold text-foreground">
                  {weeklyUsage.count} / {weeklyUsage.limit}
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      {dataState === 'loading' || (bookingsLoading && bookings.length === 0) ? (
        <ScreenSkeleton />
      ) : hasError || dataState === 'error' ? (
        <ErrorState onRetry={reloadData} />
      ) : (
        <div className="space-y-6 px-4 pb-24">
          {tabIndex === 0 ? (
            /* ─────────────────────────────────────────────────────────────
               VIEW 1: BOOK A SESSION (Apple Minimalist Style)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Apple-style Weekly Progress Bar */}
              {weeklyUsage && (
                <div className="space-y-1.5 px-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <div
                      className={[
                        'h-full rounded-full transition-all duration-300 ease-out',
                        isWeeklyLimitReached ? 'bg-amber-500' : 'bg-primary'
                      ].join(' ')}
                      style={{
                        width: `${Math.min(
                          100,
                          (weeklyUsage.count / Math.max(1, weeklyUsage.limit)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Apple Calendar Week Strip */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-sans text-section font-semibold uppercase text-mutedfg">
                    {t.stepDate}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Oldingi hafta"
                      onClick={() => shiftWeek(-1)}
                      className="flex h-8 w-8 items-center justify-center text-primary transition-opacity active:opacity-60"
                    >
                      <ChevronLeftIcon size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Keyingi hafta"
                      onClick={() => shiftWeek(1)}
                      className="flex h-8 w-8 items-center justify-center text-primary transition-opacity active:opacity-60"
                    >
                      <ChevronRightIcon size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map((d, i) => {
                    const iso = d.iso;
                    const check = isDateBookable(
                      iso,
                      settings.bookingWeekdays,
                      settings.holidays
                    );
                    const disabled = !check.bookable;
                    const selected = iso === selectedDate;
                    const isCurrentToday = iso === todayIso;

                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          haptic('light');
                          setSelectedDate(iso);
                          setSelectedSlotId(null);
                        }}
                        className={[
                          'flex h-[66px] flex-col items-center justify-center rounded-card border transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]',
                          selected
                            ? 'border-primary bg-primary text-primaryfg shadow-sm'
                            : disabled
                            ? 'pointer-events-none border-transparent bg-slate-100/60 text-slate-300 dark:bg-slate-800/40 dark:text-slate-600 opacity-40'
                            : 'border-cardborder bg-card text-foreground hover:border-primary/40'
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'font-sans text-[10px] font-medium uppercase',
                            selected
                              ? 'text-primaryfg/85'
                              : disabled
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-mutedfg'
                          ].join(' ')}
                        >
                          {t.weekdaysShort[i]}
                        </span>

                        <span className="font-display text-[17px] font-semibold tabular-nums">
                          {d.date.getDate()}
                        </span>

                        {isCurrentToday && (
                          <span
                            className={[
                              'mt-0.5 h-1 w-1 rounded-full',
                              selected ? 'bg-white' : 'bg-primary'
                            ].join(' ')}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <p className="px-1 font-sans text-footnote text-mutedfg">
                    {longDate(selectedDate)}
                  </p>
                )}
              </section>

              {/* Time Slots List (Apple Grouped Style) */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-sans text-section font-semibold uppercase text-mutedfg">
                    {t.sessionsAvailable}
                  </h3>
                  {selectedDate && (
                    <span className="font-sans text-footnote tabular-nums text-mutedfg">
                      {slots.filter((s) => !s.full && !s.closed).length} ochiq
                    </span>
                  )}
                </div>

                {slotsLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-[60px] w-full" radius={12} />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <Card>
                    <p className="py-4 text-center font-sans text-subhead text-mutedfg">
                      {t.noSlotsForDate}
                    </p>
                  </Card>
                ) : (
                  <div className="overflow-hidden rounded-card border border-cardborder bg-card">
                    {slots.map((slot, index) => {
                      const isSelected = slot.timeSlotId === selectedSlotId;
                      const isFull = slot.full;
                      const isClosed = !!slot.closed;
                      const disabled = isFull || isClosed;
                      const isLast = index === slots.length - 1;

                      return (
                        <div
                          key={slot.timeSlotId}
                          onClick={() => {
                            if (!disabled) {
                              haptic('light');
                              setSelectedSlotId(slot.timeSlotId);
                            }
                          }}
                          className={[
                            'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                            !isLast ? 'border-b border-hairline' : '',
                            disabled
                              ? 'cursor-not-allowed opacity-40'
                              : isSelected
                              ? 'bg-primary/[0.08] cursor-pointer'
                              : 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 active:bg-slate-100/60 dark:active:bg-slate-800/60'
                          ].join(' ')}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-headline font-semibold tabular-nums text-foreground">
                                {slot.startTime}
                                {slot.endTime ? ` – ${slot.endTime}` : ''}
                              </span>
                              {isSelected && (
                                <CheckCircle2Icon size={16} className="text-primary" />
                              )}
                            </div>
                            <span className="block font-sans text-caption text-mutedfg">
                              {slot.label}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <span
                              className={[
                                'font-sans text-caption font-medium tabular-nums',
                                isFull
                                  ? 'text-destructive font-semibold'
                                  : isSelected
                                  ? 'text-primary font-semibold'
                                  : 'text-mutedfg'
                              ].join(' ')}
                            >
                              {isFull ? t.slotStatusFull : `${slot.count}/${slot.capacity}`}
                            </span>

                            {!disabled && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openNewBookingSheet(selectedDate || undefined, slot.timeSlotId);
                                }}
                                className="inline-flex h-[32px] items-center rounded-lg bg-primary/[0.12] px-3 font-sans text-footnote font-semibold text-primary transition-opacity active:opacity-70"
                              >
                                {t.tabBookings}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Bottom Confirm Action if slot is selected */}
              {selectedSlotId && selectedDate && (
                <div className="pt-2">
                  <Button
                    full
                    onClick={() => openNewBookingSheet(selectedDate, selectedSlotId)}
                  >
                    {t.confirmSession}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               VIEW 2: MY BOOKINGS LIST (Creative Apple Minimalist Style)
               - Band: Subtle warm/amber card (no "Band" text pill)
               - Attended: Subtle emerald card
               - Cancelled: Muted grey disabled card
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Category Segment Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { key: 'all' as BookingFilter, label: t.filterAll },
                  { key: 'upcoming' as BookingFilter, label: t.filterUpcoming },
                  { key: 'past' as BookingFilter, label: t.filterPast },
                  { key: 'cancelled' as BookingFilter, label: t.filterCancelled }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      haptic('light');
                      setFilter(item.key);
                    }}
                    className={[
                      'shrink-0 rounded-full px-3.5 py-1 font-sans text-footnote font-semibold transition-all active:scale-95',
                      filter === item.key
                        ? 'bg-foreground text-background shadow-sm'
                        : 'border border-cardborder bg-card text-mutedfg hover:text-foreground'
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Bookings cards list with Creative Apple Status Styling */}
              {filteredBookings.length > 0 ? (
                <div className="space-y-3">
                  {filteredBookings.map((b) => {
                    const isCancelled = !!b.cancelledAt;
                    const isAttended = b.status === 'attended';
                    const isMissed = b.status === 'missed';
                    const isBooked = b.status === 'booked' && !isCancelled;
                    const canCancel = canCancelBooking(b.date, b.cancelledAt, settings.bookingCutoff);
                    const canReschedule = isBooked;

                    return (
                      <div
                        key={b.id}
                        className={[
                          'rounded-2xl border p-4 transition-all duration-200 space-y-3',
                          // Creative Apple status colors:
                          isBooked
                            ? 'bg-amber-500/[0.05] border-amber-400/30 dark:bg-amber-500/[0.08] dark:border-amber-500/30 shadow-sm'
                            : isAttended
                            ? 'bg-emerald-500/[0.05] border-emerald-400/30 dark:bg-emerald-500/[0.08] dark:border-emerald-500/30 shadow-sm'
                            : isMissed
                            ? 'bg-rose-500/[0.05] border-rose-400/30 dark:bg-rose-500/[0.08] dark:border-rose-500/30 shadow-sm'
                            : 'bg-slate-100/60 border-slate-200/80 dark:bg-slate-900/30 dark:border-slate-800/60 opacity-60'
                        ].join(' ')}
                      >
                        {/* Header: Date on left, Time on right (Apple clean layout, no dots) */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={[
                              'font-sans text-xs font-semibold',
                              isCancelled ? 'text-mutedfg line-through' : 'text-mutedfg'
                            ].join(' ')}
                          >
                            {longDate(b.date)}
                          </span>

                          <span
                            className={[
                              'font-sans text-xs font-bold tabular-nums',
                              isCancelled ? 'text-mutedfg line-through' : 'text-foreground'
                            ].join(' ')}
                          >
                            {b.time}
                          </span>
                        </div>

                        {/* Title & Teacher/Room */}
                        <div>
                          <h4
                            className={[
                              'font-sans text-base font-bold',
                              isCancelled ? 'text-mutedfg line-through' : 'text-foreground'
                            ].join(' ')}
                          >
                            {b.purpose || 'Qo‘shimcha dars'}
                          </h4>

                          <p className="mt-0.5 font-sans text-xs text-mutedfg">
                            {b.teacherName || student.teacher} · {b.room || '204-xona'}
                          </p>
                        </div>

                        {/* Apple style Pill Action buttons (Vaqtni o'zgartirish & Bekor qilish) */}
                        {(canReschedule || canCancel) && (
                          <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
                            {canReschedule && (
                              <button
                                type="button"
                                onClick={() => openRescheduleSheet(b)}
                                className="rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:bg-blue-400/15 dark:text-blue-400 font-sans text-xs font-semibold px-3.5 py-1.5 transition-all active:scale-95"
                              >
                                {t.rescheduleTitle}
                              </button>
                            )}

                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => openCancelSheet(b)}
                                className="rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:bg-red-400/15 dark:text-red-400 font-sans text-xs font-semibold px-3.5 py-1.5 transition-all active:scale-95"
                              >
                                {t.swipeCancel}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheckIcon}
                  title={
                    filter === 'upcoming'
                      ? t.noUpcomingBookings
                      : filter === 'past'
                      ? t.noPastBookings
                      : filter === 'cancelled'
                      ? t.noCancelledBookings
                      : t.emptyBookingsTitle
                  }
                  body={t.emptyBookingsBody}
                  action={
                    <Button
                      full
                      onClick={() => setTabIndex(0)}
                    >
                      {t.newBooking}
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>
      )}
    </ScrollScreen>
  );
}
