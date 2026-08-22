/**
 * Authenticated account shape returned by Phoenix-MS.
 * Mirrors PublicUser from Phoenix-MS shared/schema.ts (password + TOTP
 * secrets are stripped server-side) plus the extras that
 * POST /api/auth/login and GET /api/auth/me attach to the body.
 */
export type PhoenixRole = 'ceo' | 'manager' | 'admin' | 'teacher' | 'student' | 'parent';

export interface PhoenixUser {
  id: number;
  username: string;
  role: PhoenixRole;
  isActive: boolean;
  mustChangePassword: boolean;
  /** ISO timestamp of the portal consent tick; null until the family agrees. */
  consentAt: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  birthday?: string | null;
  studentType?: string | null;
  /** Attached by login and /api/auth/me responses. */
  hasPhoto?: boolean;
  demo?: boolean;
  openGates?: boolean;
  /** /api/auth/me only — true while the server-side screen lock is on. */
  locked?: boolean;
}

/** Roles this app has screens for. */
export function isPortalRole(role: string): role is 'student' | 'parent' {
  return role === 'student' || role === 'parent';
}

/**
 * Identity of the signed-in account, straight from the session.
 *
 * Parent logins carry no name: Phoenix-MS creates them with username/password/
 * role only (storage.ts), and the guardian's name lives on the guardian record,
 * which is a later phase. Those accounts therefore fall back to the login id —
 * never to a mock person's name, which would attach a stranger's identity to a
 * real account.
 */
export function firstNameOf(user: PhoenixUser | null): string {
  return user?.firstName?.trim() || user?.username || '';
}

export function fullNameOf(user: PhoenixUser | null): string {
  const full = [user?.firstName, user?.lastName].
  filter((part) => !!part && part.trim()).
  join(' ').
  trim();
  return full || user?.name?.trim() || user?.username || '';
}
