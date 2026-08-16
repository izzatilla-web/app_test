import React, { useState } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { t } from '../strings';
import { haptic } from '../tokens';
import { slots, TODAY } from '../mockData';
import { useUI } from '../ui';

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mondayOf(iso: string): Date {
  const d = new Date(iso + 'T00:00:00');
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

export function NewBookingSheet({ initialPurpose = '' }: {initialPurpose?: string;}) {
  const { closeSheet, toast } = useUI();
  const [weekStart, setWeekStart] = useState(() => mondayOf(TODAY));
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [purpose, setPurpose] = useState(initialPurpose);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const ready = slotId !== null && purpose.trim().length >= 3;

  function shiftWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  }

  return (
    <Sheet
      title={t.sheetNewBooking}
      detent="large"
      onClose={closeSheet}
      footer={
      <Button
        full
        disabled={!ready}
        onClick={() => {
          haptic('success');
          closeSheet();
          toast(t.bookingConfirmed);
        }}>
        
          {t.confirm}
        </Button>
      }>
      
      <section className="px-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-section font-semibold uppercase text-mutedfg">
            {t.stepDate}
          </h3>
          <div className="flex">
            <button
              type="button"
              aria-label="Oldingi hafta"
              onClick={() => shiftWeek(-1)}
              className="flex h-[44px] w-[36px] items-center justify-center text-primary active:scale-[0.97]">
              
              <ChevronLeftIcon size={18} />
            </button>
            <button
              type="button"
              aria-label="Keyingi hafta"
              onClick={() => shiftWeek(1)}
              className="flex h-[44px] w-[36px] items-center justify-center text-primary active:scale-[0.97]">
              
              <ChevronRightIcon size={18} />
            </button>
          </div>
        </div>

        <div className="mt-1 grid grid-cols-7 gap-[6px]">
          {days.map((d, i) => {
            const iso = isoOf(d);
            const isSunday = i === 6;
            const isPast = iso < TODAY;
            const disabled = isSunday || isPast;
            const selected = iso === date;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => {
                  haptic('light');
                  setDate(iso);
                }}
                className={[
                'flex h-[62px] flex-col items-center justify-center gap-1 rounded-card border transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]',
                disabled ? 'pointer-events-none opacity-30' : '',
                selected ?
                'border-primary bg-primary text-primaryfg' :
                'border-cardborder bg-card text-foreground'].
                join(' ')}>
                
                <span
                  className={[
                  'font-sans text-[10px] font-medium uppercase',
                  selected ? 'text-primaryfg/80' : 'text-mutedfg'].
                  join(' ')}>
                  
                  {t.weekdaysShort[i]}
                </span>
                <span className="font-display text-[17px] font-semibold tabular-nums">
                  {d.getDate()}
                </span>
              </button>);

          })}
        </div>
      </section>

      <section className="mt-7 px-4">
        <h3 className="font-sans text-section font-semibold uppercase text-mutedfg">
          {t.stepTime}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {slots.map((slot) => {
            const full = slot.taken >= slot.capacity;
            const selected = slot.id === slotId;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={full}
                onClick={() => {
                  haptic('light');
                  setSlotId(slot.id);
                }}
                className={[
                'flex flex-col items-start gap-1 rounded-card border px-3 py-3 text-left transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]',
                full ? 'pointer-events-none opacity-40' : '',
                selected ? 'border-primary bg-primary/[0.08]' : 'border-cardborder bg-card'].
                join(' ')}>
                
                <span
                  className={[
                  'font-sans text-headline font-semibold tabular-nums text-foreground',
                  full ? 'line-through' : ''].
                  join(' ')}>
                  
                  {slot.label}
                </span>
                <span className="font-sans text-caption tabular-nums text-mutedfg">
                  {slot.taken}/{slot.capacity}
                </span>
              </button>);

          })}
        </div>
      </section>

      <section className="mt-7 px-4">
        <h3 className="font-sans text-section font-semibold uppercase text-mutedfg">
          {t.stepPurpose}
        </h3>
        <input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder={t.purposePlaceholder}
          className="mt-2 h-[50px] w-full rounded-input border border-cardborder bg-card px-4 font-sans text-body text-foreground outline-none placeholder:text-mutedfg/60 focus:border-primary" />
        
        <p className="mt-2 px-1 font-sans text-footnote text-mutedfg">{t.purposeHint}</p>
      </section>
    </Sheet>);

}