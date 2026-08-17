import React, { useState } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { AlertCircleIcon, ClockIcon } from 'lucide-react';
import { t } from '../strings';
import { haptic, longDate } from '../tokens';
import type { BookingRecord } from '../types/booking';
import { useUI } from '../ui';
import { cancelBooking } from '../services/bookingApi';
import { isToday } from '../utils/tashkentTime';

interface CancelBookingSheetProps {
  booking: BookingRecord;
  onCancelled: (id: number | string) => void;
  bookingCutoff?: string;
}

export function CancelBookingSheet({
  booking,
  onCancelled,
  bookingCutoff = '12:00'
}: CancelBookingSheetProps) {
  const { closeSheet, toast } = useUI();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isTodaySession = isToday(booking.date);
  const trimmed = reason.trim();
  const validLength = trimmed.length >= 10 && trimmed.length <= 300;
  const ready = validLength && !submitting;

  async function handleCancel() {
    if (!ready || submitting) return;

    try {
      setSubmitting(true);
      setServerError(null);
      haptic('warning');

      await cancelBooking(booking.id, trimmed);

      haptic('light');
      toast(t.bookingCancelledToast, 'warning');
      onCancelled(booking.id);
      closeSheet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      setServerError(msg);
      toast(msg, 'warning');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={t.cancelTitle}
      subtitle={`${longDate(booking.date)} · ${booking.time}`}
      detent="medium"
      onClose={closeSheet}
      footer={
        <div className="space-y-1">
          {serverError && (
            <div className="flex items-center gap-2 rounded-card bg-destructive/[0.12] px-3.5 py-2 text-xs font-semibold text-destructive">
              <AlertCircleIcon size={16} className="shrink-0" />
              <span className="flex-1">{serverError}</span>
            </div>
          )}

          <Button
            variant="destructive"
            full
            disabled={!ready}
            onClick={handleCancel}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Bekor qilinmoqda...</span>
              </div>
            ) : (
              t.cancelConfirm
            )}
          </Button>

          <Button variant="plain" full onClick={closeSheet} disabled={submitting}>
            {t.cancelKeep}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-4 pb-2">
        {/* Same day cancellation warning banner if applicable */}
        {isTodaySession && (
          <div className="flex items-start gap-2 rounded-card bg-warn/[0.12] p-3 text-xs font-medium text-warn">
            <ClockIcon size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1">{t.sameDayCutoffNotice(bookingCutoff)}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="font-sans text-section font-semibold uppercase text-mutedfg">
              {t.cancelReasonLabel}
            </label>
            <span
              className={[
                'font-sans text-footnote tabular-nums',
                trimmed.length < 10
                  ? 'text-warn font-medium'
                  : trimmed.length > 300
                  ? 'text-destructive font-bold'
                  : 'text-mutedfg'
              ].join(' ')}
            >
              {trimmed.length}/300
            </span>
          </div>

          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (serverError) setServerError(null);
            }}
            rows={4}
            placeholder={t.cancelReasonPlaceholder}
            className="w-full resize-none rounded-input border border-cardborder bg-card px-4 py-3 font-sans text-body text-foreground outline-none transition-colors placeholder:text-mutedfg/60 focus:border-primary"
          />

          <p className="px-1 font-sans text-footnote text-mutedfg">
            {t.cancelReasonHint}
          </p>
        </div>
      </div>
    </Sheet>
  );
}