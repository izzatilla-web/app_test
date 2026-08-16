import React, { useState } from 'react';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { t } from '../strings';
import { haptic } from '../tokens';
import { useUI } from '../ui';

export function PhoneSheet({
  value,
  onSave



}: {value: string;onSave: (phone: string) => void;}) {
  const { closeSheet, toast } = useUI();
  const [phone, setPhone] = useState(value);

  return (
    <Sheet title={t.phoneSheetTitle} detent="medium" onClose={closeSheet}>
      <div className="px-4">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          className="h-[50px] w-full rounded-input border border-cardborder bg-card px-4 font-sans text-body tabular-nums text-foreground outline-none focus:border-primary" />
        
        <p className="mt-2 px-1 font-sans text-footnote text-mutedfg">{t.phoneNote}</p>
        <div className="mt-5">
          <Button
            full
            disabled={phone.trim().length < 9}
            onClick={() => {
              haptic('success');
              onSave(phone.trim());
              closeSheet();
              toast(t.saved);
            }}>
            
            {t.save}
          </Button>
        </div>
      </div>
    </Sheet>);

}