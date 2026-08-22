import React, { useState } from 'react';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { t } from '../strings';
import { haptic } from '../tokens';
import { useUI } from '../ui';

export function PhoneSheet({
  value,
  onSave




}: {value: string;
  /** Saves to Phoenix-MS. Resolves null on success, or a message to show. */
  onSave: (phone: string) => Promise<string | null>;}) {
  const { closeSheet, toast } = useUI();
  const [phone, setPhone] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const message = await onSave(phone.trim());
    setBusy(false);
    if (message) {
      haptic('warning');
      setError(message);
      return;
    }
    haptic('success');
    closeSheet();
    toast(t.saved);
  }

  return (
    <Sheet title={t.phoneSheetTitle} detent="medium" onClose={closeSheet}>
      <div className="px-4">
        <input
          value={phone}
          onChange={(e) => {
            setError(null);
            setPhone(e.target.value);
          }}
          inputMode="tel"
          className="h-[50px] w-full rounded-input border border-cardborder bg-card px-4 font-sans text-body tabular-nums text-foreground outline-none focus:border-primary" />

        <p className="mt-2 px-1 font-sans text-footnote text-mutedfg">{t.phoneNote}</p>
        {error &&
        <p className="mt-2 px-1 font-sans text-footnote text-destructive">{error}</p>
        }
        <div className="mt-5">
          <Button full disabled={phone.trim().length < 9 || busy} onClick={save}>
            {t.save}
          </Button>
        </div>
      </div>
    </Sheet>);

}
