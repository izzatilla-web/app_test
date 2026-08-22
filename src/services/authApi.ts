/**
 * Phoenix-MS authentication endpoints (verified against Phoenix-MS
 * server/routes.ts and shared/routes.ts):
 *
 *   POST /api/auth/login            {username, password} → user | {needsCode:true} | 400/401/429
 *   GET  /api/auth/me               → user (+locked) | 401 {"message":"Not authenticated"}
 *   POST /api/auth/logout           → 200 (text body; clears the phoenix.sid cookie)
 *   POST /api/auth/change-password  {newPassword, currentPassword?, consent?} → 200 (empty) | 400/401
 *
 * The session itself lives in the httpOnly phoenix.sid cookie — nothing about
 * it is stored client-side.
 */
import { ApiError, apiFetch } from './http';
import type { PhoenixUser } from '../types/phoenixUser';

export type LoginResult =
{ kind: 'ok'; user: PhoenixUser } |
/** Account has the TOTP second step armed; this app does not implement it. */
{ kind: 'needsCode' };

export async function login(username: string, password: string): Promise<LoginResult> {
  const data = await apiFetch<PhoenixUser | { needsCode: true }>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    on401: 'silent'
  });
  if (data && 'needsCode' in data && data.needsCode) return { kind: 'needsCode' };
  return { kind: 'ok', user: data as PhoenixUser };
}

/** Session probe. Resolves null when no valid session exists (401). */
export async function fetchMe(
options: { on401?: 'global' | 'silent' } = {})
: Promise<PhoenixUser | null> {
  try {
    return await apiFetch<PhoenixUser>('/api/auth/me', { on401: options.on401 ?? 'global' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function logout(): Promise<void> {
  await apiFetch<null>('/api/auth/logout', { method: 'POST', on401: 'silent' });
}

/**
 * Forced first change sends {newPassword} (+ consent:true when the portal
 * account has not consented yet — the server 400s without it).
 * currentPassword is only for voluntary changes, which this app does not
 * offer yet.
 */
export async function changePassword(input: {
  newPassword: string;
  currentPassword?: string;
  consent?: boolean;
}): Promise<void> {
  await apiFetch<null>('/api/auth/change-password', { method: 'POST', body: input });
}

/* ── Screen lock ────────────────────────────────────────────────── */

/**
 * Locks the session on the server, not just this screen. While locked
 * Phoenix-MS answers 403 `{code:"LOCKED"}` to everything except unlock,
 * logout and `GET /api/auth/me` — so a locked phone left on a desk cannot
 * read or change anything even from another tab.
 */
export function lockSession(): Promise<null> {
  return apiFetch<null>('/api/auth/lock', { method: 'POST' });
}

/**
 * Unlocks with the account password — the CRM asks for it, not a PIN.
 * Five wrong tries end the session outright: the answer is then 401 with
 * `code: "SESSION_ENDED"` and the cookie is cleared.
 */
export function unlockSession(password: string): Promise<null> {
  return apiFetch<null>('/api/auth/unlock', { method: 'POST', body: { password }, on401: 'silent' });
}

/* ── Devices signed in ──────────────────────────────────────────── */

export interface SessionInfo {
  id: string;
  current: boolean;
  browser: string;
  os: string;
  createdAt: string;
  lastSeen: string;
}

export function listSessions(): Promise<SessionInfo[]> {
  return apiFetch<SessionInfo[]>('/api/auth/sessions');
}

export function revokeSession(id: string): Promise<null> {
  return apiFetch<null>(`/api/auth/sessions/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
}

export function revokeOtherSessions(): Promise<{ revoked: number }> {
  return apiFetch<{ revoked: number }>('/api/auth/sessions/revoke-others', { method: 'POST' });
}
