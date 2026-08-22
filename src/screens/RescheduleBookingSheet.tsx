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
import type { BookingRecord, BookingSlot } from '../types/booking';
import {
  getBookingSlots,
  getSchoolSettings,
  rescheduleBooking
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

interface RescheduleBookingSheetProps {
  booking: BookingRecord;
  onRescheduled: (updated: BookingRecord) => void;
}

export function RescheduleBookingSheet({
  booking,
  onRescheduled
}: RescheduleBookingSheetProps) {
  const { closeSheet, toast } = useUI();
  const todayIso = useMemo(() => getTashkentTodayIso(), []);

  const [weekMondayIso, setWeekMondayIso] = useState<string>(() => {
    if (booking.date) return getMondayOfWeek(booking.date);
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
  }>({
    bookingWeekdays: '1,2,3,4,5,6',
    holidays: []
  });

  const [date, setDate] = useState<string>(booking.date);
  const [slotId, setSlotId] = useState<string>(booking.timeSlotId);
  const [purpose, setPurpose] = useState(booking.purpose || '');

  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const weekDays = useMemo(() => getDaysOfWeek(weekMondayIso), [weekMondayIso]);

  useEffect(() => {
    getSchoolSettings().then((s) => {
      setSchoolSettings({
        bookingWeekdays: s.bookingWeekdays,
        holidays: s.holidays || []
      });
    });
  }, []);

  useEffect(() => {
    if (!date) return;

    let isMounted = true;
    setSlotsLoading(true);
    setServerError(null);

    getBookingSlots(date)
      .then((data) => {
        if (isMounted) {
          setSlots(data);
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

  function shiftWeek(delta: number) {
    haptic('light');
    const curr = parseIsoDate(weekMondayIso);
    curr.setDate(curr.getDate() + delta * 7);
    const nextMonday = formatIsoDate(curr);
    setWeekMondayIso(nextMonday);
    setDate(nextMonday);
    setServerError(null);
  }

  const trimmedPurpose = purpose.trim();
  const purposeValid = trimmedPurpose.length >= 3 && trimmedPurpose.length <= 300;
  const ready = !!date && !!slotId && purposeValid && !submitting;

  async function handleReschedule() {
    if (!ready || submitting) return;

    try {
      setSubmitting(true);
      setServerError(null);
      haptic('light');

      const updated = await rescheduleBooking(booking.id, {
        date,
        timeSlotId: slotId,
        purpose: trimmedPurpose
      });

      haptic('success');
      toast(t.rescheduleSuccess, 'success');
      onRescheduled(updated);
      closeSheet();
    } catch (err: unknown) {
      haptic('warning');
      const msg = err instanceof Error ? err.message : 'Reschedule failed';
      setServerError(msg);
      toast(msg, 'warning');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={t.rescheduleTitle}
      subtitle={`Hozirgi: ${longDate(booking.date)} · ${booking.time}`}
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
            disabled={!ready}
            onClick={handleReschedule}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>O‘zgartirilmoqda...</span>
              </div>
            ) : (
              t.rescheduleConfirm
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 px-4 pb-4">
        {/* Step 1: New Date Selector */}
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

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    haptic('light');
                    setDate(iso);
                    setServerError(null);
                  }}
                  className={[
                    'flex h-[62px] flex-col items-center justify-center rounded-card border transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]',
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

          {date && (
            <p className="px-1 font-sans text-footnote text-mutedfg">
              {longDate(date)}
            </p>
          )}
        </section>

        {/* Step 2: Slot Selection */}
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
                const isCurrentBookingSlot =
                  date === booking.date && slot.timeSlotId === booking.timeSlotId;
                const isFull = slot.full && !isCurrentBookingSlot;
                const isClosed = !!slot.closed;
                const disabled = isFull || isClosed;
                const isLast = index === slots.length - 1;

                return (
                  <button
                    key={slot.timeSlotId}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      haptic('light');
                      setSlotId(slot.timeSlotId);
                      setServerError(null);
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
                          {slot.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2Icon size={16} className="text-primary" />
                        )}
                      </div>
                      {/* The CRM's label is the hours themselves, so this line shows
                          the room left instead of repeating them. */}
                      <span className="block font-sans text-caption text-mutedfg">
                        {slot.full ?
                        t.slotStatusFull :
                        slot.capacity - slot.count <= 3 ?
                        t.slotLastPlaces(slot.capacity - slot.count) :
                        t.slotFreePlaces(slot.capacity - slot.count)}
                      </span>
                    </div>

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
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 3: Purpose */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-sans text-section font-semibold uppercase text-mutedfg">
              {t.stepPurpose}
            </span>
            <span className="font-sans text-footnote text-mutedfg tabular-nums">
              {trimmedPurpose.length}/300
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
        </section>
      </div>
    </Sheet>
  );
}
