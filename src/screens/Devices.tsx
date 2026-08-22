import React, { useCallback, useEffect, useState } from 'react';
import { LaptopIcon, SmartphoneIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { ListGroup, ListRow } from '../components/List';
import { Button } from '../components/Button';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { StatusPill } from '../components/StatusPill';
import { listSessions, revokeOtherSessions, revokeSession } from '../services/authApi';
import type { SessionInfo } from '../services/authApi';
import { ApiError } from '../services/http';
import { t } from '../strings';
import { mediumDate, haptic } from '../tokens';
import { useUI } from '../ui';

/**
 * Every session Phoenix-MS is holding for this account.
 *
 * The CRM refuses to revoke the session making the request — signing out is
 * that session's own action — so this screen offers no revoke on the current
 * device, matching the server rather than letting it fail.
 */
export function Devices({ backTitle }: { backTitle: string }) {
  const ui = useUI();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(false);
    listSessions().
    then(setSessions).
    catch(() => {
      setSessions(null);
      setError(true);
    });
  }, []);

  useEffect(load, [load]);

  async function revokeOne(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await revokeSession(id);
      haptic('success');
      load();
    } catch (err) {
      haptic('warning');
      ui.toast(err instanceof ApiError ? err.message : t.authErrGeneric, 'warning');
    } finally {
      setBusy(false);
    }
  }

  async function revokeRest() {
    if (busy) return;
    setBusy(true);
    try {
      const { revoked } = await revokeOtherSessions();
      haptic('success');
      ui.toast(t.devicesRevoked(revoked), 'success');
      load();
    } catch (err) {
      haptic('warning');
      ui.toast(err instanceof ApiError ? err.message : t.authErrGeneric, 'warning');
    } finally {
      setBusy(false);
    }
  }

  const others = (sessions ?? []).filter((s) => !s.current);

  return (
    <PushScreen title={t.devicesTitle} backTitle={backTitle} onBack={ui.pop}>
      {sessions === null ?
      error ?
      <ErrorState onRetry={load} /> :
      <ScreenSkeleton /> :

      <div className="space-y-5 px-4 pb-10 pt-2">
          <ListGroup footer={t.devicesFooter}>
            {sessions.map((session, i) =>
          <ListRow
            key={session.id}
            last={i === sessions.length - 1}
            icon={/mobile|android|iphone|ipad/i.test(session.os + session.browser) ? SmartphoneIcon : LaptopIcon}
            label={
            <span className="flex items-center gap-2">
                    {[session.browser, session.os].filter(Boolean).join(' · ') || t.devicesUnknown}
                    {session.current &&
              <StatusPill tone="green" label={t.devicesCurrent} />
              }
                  </span>
            }
            below={
            <span className="mt-0.5 block font-sans text-xs tabular-nums text-mutedfg">
                    {t.devicesLastSeen(mediumDate(session.lastSeen.slice(0, 10)))}
                  </span>
            }
            trailing={
            session.current ?
            undefined :
            <button
              type="button"
              disabled={busy}
              onClick={() => revokeOne(session.id)}
              className="font-sans text-footnote font-semibold text-destructive transition-opacity active:opacity-70 disabled:opacity-40">

                      {t.devicesSignOut}
                    </button>
            } />

          )}
          </ListGroup>

          {others.length > 0 &&
        <Button variant="secondary" full disabled={busy} onClick={revokeRest}>
              {t.devicesSignOutOthers}
            </Button>
        }

          {others.length === 0 &&
        <p className="px-1 text-center font-sans text-footnote text-mutedfg">
              {t.devicesNoOthers}
            </p>
        }
        </div>
      }
    </PushScreen>);

}
