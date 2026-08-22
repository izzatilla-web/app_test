import React, { useState } from 'react';
import { CheckIcon, LockIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../strings';
import { haptic } from '../tokens';

interface NewPasswordProps {
  /** Portal accounts that never consented must tick the school-rules box (Phoenix-MS 400s without it). */
  needsConsent: boolean;
  /** Real Phoenix-MS password change. Resolves null on success, or an error message to show. */
  onSubmit: (newPassword: string) => Promise<string | null>;
}

export function NewPassword({ needsConsent, onSubmit }: NewPasswordProps) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rules = [
  { label: t.pwRule8, ok: first.length >= 8 },
  { label: t.pwRuleDigit, ok: /\d/.test(first) },
  { label: t.pwRuleMatch, ok: first.length > 0 && first === second }];

  const allOk = rules.every((r) => r.ok) && (!needsConsent || consent);

  async function save() {
    if (!allOk || busy) return;
    setBusy(true);
    setError(null);
    const message = await onSubmit(first);
    setBusy(false);
    if (message) {
      haptic('warning');
      setError(message);
      return;
    }
    haptic('success');
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background px-6 pb-10 pt-[92px]">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-primary/[0.12]">
          <LockIcon size={40} className="text-primary" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 font-display text-title2 font-semibold text-foreground">{t.pwTitle}</h1>
        <p className="mt-2 font-sans text-callout text-mutedfg">{t.pwBody}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-card border border-cardborder bg-card">
        <input
          value={first}
          onChange={(e) => {
            setError(null);
            setFirst(e.target.value);
          }}
          type="password"
          placeholder={t.pwNew}
          className="h-[50px] w-full border-b border-hairline bg-transparent px-4 font-sans text-body text-foreground outline-none placeholder:text-mutedfg/60" />

        <input
          value={second}
          onChange={(e) => {
            setError(null);
            setSecond(e.target.value);
          }}
          type="password"
          placeholder={t.pwRepeat}
          className="h-[50px] w-full bg-transparent px-4 font-sans text-body text-foreground outline-none placeholder:text-mutedfg/60" />

      </div>

      <ul className="mt-4 space-y-2 px-1">
        {rules.map((rule) =>
        <li key={rule.label} className="flex items-center gap-2">
            <span
            className={[
            'flex h-[20px] w-[20px] items-center justify-center rounded-full transition-colors duration-200 ease-out',
            rule.ok ? 'bg-good' : 'border border-muted bg-transparent'].
            join(' ')}>

              {rule.ok && <CheckIcon size={13} className="text-white" strokeWidth={3} />}
            </span>
            <span
            className={[
            'font-sans text-footnote',
            rule.ok ? 'text-foreground' : 'text-mutedfg'].
            join(' ')}>

              {rule.label}
            </span>
          </li>
        )}
      </ul>

      {needsConsent &&
      <label className="mt-5 flex items-start gap-3 px-1">
          <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-[2px] h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]" />

          <span className="font-sans text-footnote text-foreground">{t.pwConsent}</span>
        </label>
      }

      {error &&
      <p className="mt-4 px-1 font-sans text-footnote text-destructive">{error}</p>
      }

      <div className="mt-8">
        <Button full disabled={!allOk || busy} onClick={save}>
          {t.pwSave}
        </Button>
      </div>
    </div>);

}
