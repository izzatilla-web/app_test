import React, { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { t } from '../strings';
import { haptic, longDate } from '../tokens';
import { useUI } from '../ui';
import type { BookingRecord, BookingSlot, WeeklyUsage } from '../types/booking';
import {
  createBooking,
  getBookingSlots,
  getMyBookings,
  getSchoolSettings,
  getWeeklyBookingUsage
} from '../services/bookingApi';
import {
  formatIsoDate,
  getDaysOfWeek,
  getMondayOfWeek,
  getTashkentNow,
  getTashkentTodayIso,
  isDateBookable,
  parseIsoDate
} from '../utils/tashkentTime';

interface NewBookingSheetProps {
  initialPurpose?: string;
  initialDate?: string;
  initialSlotId?: string;
  onSuccess?: () => void;
}

export function NewBookingSheet({
  initialPurpose = '',
  initialDate,
  initialSlotId,
  onSuccess
}: NewBookingSheetProps) {
  const { closeSheet, toast } = useUI();

  // Tashkent today & initial setup
  const todayIso = useMemo(() => getTashkentTodayIso(), []);

  // Compute initial week Monday
  const [weekMondayIso, setWeekMondayIso] = useState<string>(() => {
    if (initialDate) return getMondayOfWeek(initialDate);
    const tashkentNow = getTashkentNow();
    if (tashkentNow.getDay() === 0) {
      const nextMon = new Date(tashkentNow);
      nextMon.setDate(tashkentNow.getDate() + 1);
      return formatIsoDate(nextMon);
    }
    return getMondayOfWeek(todayIso);
  });

  const [schoolSettings, setSchoolSettings] = useState<{
    bookingWeekdays: string;
    holidays: string[];
    bookingCutoff: string;
  }>({
    bookingWeekdays: '1,2,3,4,5,6',
    holidays: [],
    bookingCutoff: '12:00'
  });

  const [date, setDate] = useState<string | null>(initialDate || null);
  const [slotId, setSlotId] = useState<string | null>(initialSlotId || null);
  const [purpose, setPurpose] = useState(initialPurpose);

  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [existingBookings, setExistingBookings] = useState<BookingRecord[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 7 days of the currently selected week
  const weekDays = useMemo(() => getDaysOfWeek(weekMondayIso), [weekMondayIso]);

  // Load existing bookings to check for 1-booking-per-day rule
  useEffect(() => {
    getMyBookings().then(setExistingBookings).catch(() => setExistingBookings([]));
  }, []);

  const bookingOnSelectedDate = useMemo(() => {
    if (!date) return null;
    return existingBookings.find((b) => b.date === date && b.status === 'booked' && !b.cancelledAt);
  }, [date, existingBookings]);

  // Load school settings
  useEffect(() => {
    getSchoolSettings().then((settings) => {
      setSchoolSettings({
        bookingWeekdays: settings.bookingWeekdays,
        holidays: settings.holidays || [],
        bookingCutoff: settings.bookingCutoff
      });
    });
  }, []);

  // Set default selected date if none selected
  useEffect(() => {
    if (!date) {
      const firstBookable = weekDays.find((d) => {
        const check = isDateBookable(d.iso, schoolSettings.bookingWeekdays, schoolSettings.holidays);
        return check.bookable;
      });
      if (firstBookable) {
        setDate(firstBookable.iso);
      }
    }
  }, [date, weekDays, schoolSettings]);

  // Fetch slots whenever selected date changes
  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }

    let isMounted = true;
    setSlotsLoading(true);
    setServerError(null);

    getBookingSlots(date)
      .then((data) => {
        if (isMounted) {
          setSlots(data);
          if (slotId) {
            const target = data.find((s) => s.timeSlotId === slotId);
            if (!target || target.full || target.closed) {
              setSlotId(null);
            }
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setServerError(err instanceof Error ? err.message : 'Slotlarni yuklashda xatolik');
        }
      })
      .finally(() => {
        if (isMounted) setSlotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [date]);

  // Fetch weekly usage for the active date
  useEffect(() => {
    if (!date) return;
    setLoadingUsage(true);
    getWeeklyBookingUsage(date)
      .then((u) => setWeeklyUsage(u))
      .catch(() => setWeeklyUsage(null))
      .finally(() => setLoadingUsage(false));
  }, [date]);

  function shiftWeek(delta: number) {
    haptic('light');
    const curr = parseIsoDate(weekMondayIso);
    curr.setDate(curr.getDate() + delta * 7);
    const nextMonday = formatIsoDate(curr);
    setWeekMondayIso(nextMonday);
    setDate(null);
    setSlotId(null);
    setServerError(null);
  }

  const purposeTrimmed = purpose.trim();
  const purposeValid = purposeTrimmed.length >= 3 && purposeTrimmed.length <= 300;
  const isLimitReached = weeklyUsage ? weeklyUsage.count >= weeklyUsage.limit : false;
  const ready = !!date && !!slotId && purposeValid && !submitting && !isLimitReached;

  async function handleConfirm() {
    if (!ready || !date || !slotId || submitting) return;

    try {
      setSubmitting(true);
      setServerError(null);
      haptic('light');

      await createBooking({
        date,
        timeSlotId: slotId,
        purpose: purposeTrimmed
      });

      haptic('success');
      toast(t.bookingConfirmed, 'success');
      onSuccess?.();
      closeSheet();
    } catch (err: unknown) {
      haptic('warning');
      const msg = err instanceof Error ? err.message : 'Booking failed';
      setServerError(msg);
      toast(msg, 'warning');

      if (date) {
        getBookingSlots(date).then(setSlots);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={t.sheetNewBooking}
      detent="large"
      onClose={closeSheet}
      footer={
        <div className="space-y-2">
          {serverError && (
            <div className="flex items-center gap-2 rounded-card bg-destructive/[0.12] px-3.5 py-2.5 text-xs font-semibold text-destructive">
              <AlertCircleIcon size={16} className="shrink-0" />
              <span className="flex-1">{serverError}</span>
            </div>
          )}

          <Button
            full
            disabled={!ready || !!bookingOnSelectedDate}
            onClick={handleConfirm}
            className={bookingOnSelectedDate ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none' : ''}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Yuklanmoqda...</span>
              </div>
            ) : bookingOnSelectedDate ? (
              'Ushbu kunga yozilgansiz'
            ) : (
              t.confirmBookingButton
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 px-4 pb-4">
        {/* Apple-style Weekly Usage Summary */}
        {weeklyUsage && (
          <div className="flex items-center justify-between px-1 font-sans text-footnote tabular-nums text-mutedfg">
            <span>
              {loadingUsage
                ? '...'
                : isLimitReached
                ? t.weeklyUsageLimitReached
                : t.weeklyUsageRemaining(weeklyUsage.remaining)}
            </span>
            <span className="font-semibold text-foreground">
              {weeklyUsage.count} / {weeklyUsage.limit}
            </span>
          </div>
        )}

        {/* Step 1: Date Selector (Apple style week strip) */}
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
                schoolSettings.bookingWeekdays,
                schoolSettings.holidays
              );
              const disabled = !check.bookable;
              const selected = iso === date;
              const isCurrentToday = iso === todayIso;
              const hasBookingThisDay = existingBookings.some((b) => b.date === iso && b.status === 'booked' && !b.cancelledAt);

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    haptic('light');
                    setDate(iso);
                    setSlotId(null);
                    setServerError(null);
                  }}
                  className={[
                    'relative flex h-[62px] flex-col items-center justify-center rounded-card border transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]',
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

                  {hasBookingThisDay ? (
                    <span
                      className={[
                        'mt-0.5 h-1.5 w-1.5 rounded-full',
                        selected ? 'bg-white' : 'bg-emerald-500'
                      ].join(' ')}
                    />
                  ) : isCurrentToday ? (
                    <span
                      className={[
                        'mt-0.5 h-1 w-1 rounded-full',
                        selected ? 'bg-white' : 'bg-primary'
                      ].join(' ')}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {date && (
            <p className="px-1 font-sans text-footnote text-mutedfg">
              {longDate(date)}
            </p>
          )}
        </section>

        {/* Apple-style same-day booking notice banner */}
        {bookingOnSelectedDate && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 dark:bg-amber-900/80 dark:text-amber-300 font-bold">
              !
            </div>
            <div className="leading-relaxed">
              Siz ushbu kunda allaqachon darsga yozilgansiz ({bookingOnSelectedDate.time || '14:00–15:20'}).
            </div>
          </div>
        )}

        {/* Step 2: Time Slots (Apple Grouped List) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-sans text-section font-semibold uppercase text-mutedfg">
              {t.stepTime}
            </span>
          </div>

          {slotsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[54px] w-full" radius={12} />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-card border border-cardborder bg-card p-6 text-center">
              <p className="font-sans text-subhead text-mutedfg">{t.noSlotsForDate}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-cardborder bg-card">
              {slots.map((slot, index) => {
                const isSelected = slot.timeSlotId === slotId;
                const isFull = slot.full;
                const isClosed = !!slot.closed;
                const isThisSlotBooked = bookingOnSelectedDate?.timeSlotId === slot.timeSlotId;
                const isOtherSlotWhenBooked = !!bookingOnSelectedDate && !isThisSlotBooked;
                const disabled = isFull || isClosed || isOtherSlotWhenBooked;
                const isLast = index === slots.length - 1;

                return (
                  <button
                    key={slot.timeSlotId}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        haptic('light');
                        setSlotId(slot.timeSlotId);
                        setServerError(null);
                      }
                    }}
                    className={[
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:opacity-80',
                      !isLast ? 'border-b border-hairline' : '',
                      disabled
                        ? 'cursor-not-allowed opacity-40'
                        : isSelected
                        ? 'bg-primary/[0.08]'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    ].join(' ')}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-headline font-semibold tabular-nums text-foreground">
                          {slot.startTime}
                          {slot.endTime ? ` – ${slot.endTime}` : ''}
                        </span>
                        {isSelected && !isThisSlotBooked && (
                          <CheckCircle2Icon size={16} className="text-primary" />
                        )}
                      </div>
                      <span className="block font-sans text-caption text-mutedfg">
                        {slot.label}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
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

                      {isThisSlotBooked && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2Icon size={12} /> Yozilgansiz
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 3: Purpose Input */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-sans text-section font-semibold uppercase text-mutedfg">
              {t.stepPurpose}
            </span>
            <span
              className={[
                'font-sans text-footnote tabular-nums',
                purposeTrimmed.length > 300
                  ? 'font-bold text-destructive'
                  : 'text-mutedfg'
              ].join(' ')}
            >
              {purposeTrimmed.length}/300
            </span>
          </div>

          <input
            type="text"
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              if (serverError) setServerError(null);
            }}
            placeholder={t.purposePlaceholder}
            className="h-[50px] w-full rounded-input border border-cardborder bg-card px-4 font-sans text-body text-foreground outline-none transition-colors placeholder:text-mutedfg/60 focus:border-primary"
          />

          <p className="px-1 font-sans text-footnote text-mutedfg">
            {t.purposeHint}
          </p>
        </section>
      </div>
    </Sheet>
  );
}