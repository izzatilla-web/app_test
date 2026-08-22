import React, { useState } from 'react';
import { LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../strings';
import { haptic } from '../tokens';

interface ScreenLockProps {
  /** Who is locked out — shown so the right account is obvious on a shared phone. */
  name: string;
  /** Unlocks against Phoenix-MS. Resolves null on success, or a message to show. */
  onUnlock: (password: string) => Promise<string | null>;
  /** Ends the session instead of unlocking. */
  onSignOut: () => void;
}

/**
 * The session is locked on the server, so nothing behind this screen is
 * readable until Phoenix-MS accepts the account password — a PIN would only
 * gate this device, and the CRM would still answer every other tab.
 */
export function ScreenLock({ name, onUnlock, onSignOut }: ScreenLockProps) {
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const message = await onUnlock(password);
    setBusy(false);
    if (message) {
      haptic('warning');
      setError(message);
      setPassword('');
      return;
    }
    haptic('success');
  }

  return (
    <div className="absolute inset-0 z-[90] flex flex-col justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-primary/[0.12]">
          <LockIcon size={38} className="text-primary" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 font-display text-title2 font-semibold text-foreground">
          {t.lockTitle}
        </h1>
        <p className="mt-2 font-sans text-callout text-mutedfg">{t.lockBody(name)}</p>
      </div>

      <div className="mt-8">
        <label className="flex items-center gap-3 overflow-hidden rounded-card border border-cardborder bg-card px-4">
          <span className="w-[92px] shrink-0 font-sans text-subhead text-mutedfg">
            {t.authPasswordLabel}
          </span>
          <input
            value={password}
            onChange={(e) => {
              setError(null);
              setPassword(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            type={reveal ? 'text' : 'password'}
            autoFocus
            placeholder={t.authPasswordPlaceholder}
            className="h-[50px] w-full bg-transparent font-sans text-body text-foreground outline-none placeholder:text-mutedfg/50" />

          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? t.authHidePassword : t.authShowPassword}
            className="flex h-[44px] w-[44px] items-center justify-center text-mutedfg transition-transform duration-100 ease-out active:scale-[0.97]">

            {reveal ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </label>

        {error &&
        <p className="mt-2 px-1 font-sans text-footnote text-destructive">{error}</p>
        }

        <div className="mt-6">
          <Button full disabled={!password || busy} onClick={submit}>
            {t.lockUnlock}
          </Button>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 w-full py-2 text-center font-sans text-footnote font-medium text-mutedfg transition-opacity active:opacity-70">

          {t.logout}
        </button>
      </div>
    </div>);

}
