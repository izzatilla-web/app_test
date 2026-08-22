import React, { useCallback, useEffect, useState } from 'react';
import { ScanFaceIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../strings';
import { haptic } from '../tokens';

interface BiometricGateProps {
  name: string;
  /** Asks the platform to confirm the owner. Resolves true when it accepts. */
  onVerify: () => Promise<boolean>;
  /** Called once the device owner is confirmed. */
  onPass: () => void;
  /**
   * Falls back to the account password by locking the session on Phoenix-MS —
   * so a failed or refused check never opens anything, it escalates.
   */
  onUsePassword: () => void;
}

/**
 * The quick way back in after the app has been idle. The platform checks the
 * face or fingerprint; this screen only reacts to its yes or no.
 *
 * It is deliberately not a security boundary of its own: the session it
 * reveals is one Phoenix-MS already granted, and anything stronger than "is
 * this the device owner" is the server lock's job.
 */
export function BiometricGate({ name, onVerify, onPass, onUsePassword }: BiometricGateProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const attempt = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await onVerify();
    setBusy(false);
    if (ok) {
      haptic('success');
      onPass();
      return;
    }
    haptic('warning');
    setFailed(true);
  }, [busy, onVerify, onPass]);

  /* Ask as soon as the screen appears — the same moment a phone would. */
  useEffect(() => {
    attempt();
    // Only on mount: a re-run would re-prompt while the sheet is already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-[90] flex flex-col justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-primary/[0.12]">
          <ScanFaceIcon size={42} className="text-primary" strokeWidth={1.6} />
        </span>
        <h1 className="mt-5 font-display text-title2 font-semibold text-foreground">
          {t.gateTitle}
        </h1>
        <p className="mt-2 font-sans text-callout text-mutedfg">{t.gateBody(name)}</p>
        {failed &&
        <p className="mt-3 font-sans text-footnote text-destructive">{t.gateFailed}</p>
        }
      </div>

      <div className="mt-8 space-y-3">
        <Button full disabled={busy} onClick={attempt}>
          {t.gateRetry}
        </Button>
        <button
          type="button"
          onClick={onUsePassword}
          className="w-full py-2 text-center font-sans text-subhead font-medium text-primary transition-opacity active:opacity-70">

          {t.gateUsePassword}
        </button>
      </div>
    </div>);

}
