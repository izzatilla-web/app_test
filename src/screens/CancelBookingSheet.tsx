import React, { useState } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { t } from '../strings';
import { haptic, longDate } from '../tokens';
import type { Booking } from '../mockData';
import { useUI } from '../ui';

export function CancelBookingSheet({
  booking,
  onCancelled



}: {booking: Booking;onCancelled: (id: number) => void;}) {
  const { closeSheet, toast } = useUI();
  const [reason, setReason] = useState('');
  const ready = reason.trim().length >= 5;

  return (
    <Sheet
      title={t.cancelTitle}
      subtitle={`${longDate(booking.date)} · ${booking.time}`}
      detent="medium"
      onClose={closeSheet}
      footer={
      <div className="space-y-1">
          <Button
          variant="destructive"
          full
          disabled={!ready}
          onClick={() => {
            haptic('warning');
            onCancelled(booking.id);
            closeSheet();
            toast(t.bookingCancelledToast);
          }}>
          
            {t.cancelConfirm}
          </Button>
          <Button variant="plain" full onClick={closeSheet}>
            {t.cancelBack}
          </Button>
        </div>
      }>
      
      <div className="px-4">
        <label className="block px-1 font-sans text-section font-semibold uppercase text-mutedfg">
          {t.cancelReasonLabel}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder={t.cancelReasonPlaceholder}
          className="mt-2 w-full resize-none rounded-input border border-cardborder bg-card px-4 py-3 font-sans text-body text-foreground outline-none placeholder:text-mutedfg/60 focus:border-primary" />
        
      </div>
    </Sheet>);

}