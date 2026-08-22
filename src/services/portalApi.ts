/**
 * Phoenix-MS portal endpoints — the family's own data.
 *
 * Verified against the running CRM:
 *   GET /api/me/student            → PortalBundle            (student login)
 *   GET /api/me/children           → PortalBundle[]          (parent login)
 *   GET /api/me/lessons[?student=] → PortalLesson[]
 *   GET /api/me/exams[?student=]   → PortalExam[]
 *
 * These are self-scoped by the server: Phoenix-MS answers only for the signed-in
 * account, so no student id is ever trusted from the client. A parent names WHICH
 * child with `?student=`; for a student login the server ignores the parameter.
 *
 * No mock fallback lives here — failures surface as ApiError.
 */
import { apiFetch } from './http';
import type { PortalBundle, PortalExam, PortalLesson } from '../types/portal';

/** The signed-in student's own record. */
export function getMyStudent(): Promise<PortalBundle> {
  return apiFetch<PortalBundle>('/api/me/student');
}

/** Every child linked to the signed-in parent, in the order the CRM returns them. */
export function getMyChildren(): Promise<PortalBundle[]> {
  return apiFetch<PortalBundle[]>('/api/me/children');
}

function withStudent(path: string, studentId?: number): string {
  return studentId === undefined ? path : `${path}?student=${encodeURIComponent(studentId)}`;
}

export function getMyLessons(studentId?: number): Promise<PortalLesson[]> {
  return apiFetch<PortalLesson[]>(withStudent('/api/me/lessons', studentId));
}

export function getMyExams(studentId?: number): Promise<PortalExam[]> {
  return apiFetch<PortalExam[]>(withStudent('/api/me/exams', studentId));
}

/**
 * The one field a family may change about themselves.
 *
 * Phoenix-MS decides whose record it is: a student login writes their own
 * `students.phone`, a parent login writes their guardian row (and relinks the
 * sibling registry). Either way the CRM records the change on the student's
 * timeline, so the front desk sees who changed it and when.
 *
 * The server validates the format and answers 400 with a message to show.
 */
export function updateMyPhone(phone: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/me/details', { method: 'PUT', body: { phone } });
}

/* ── Profile photo ──────────────────────────────────────────────── */

/**
 * Phoenix-MS takes the picture as raw bytes — any format the phone produces,
 * HEIC included, up to 15 MB. The server rotates it by its EXIF orientation,
 * crops it square at 512px and stores a JPEG, so nothing is resized here.
 *
 * It answers 400 "That file isn't a readable image" for anything it cannot
 * decode; the message is shown as the CRM wrote it.
 */
export function uploadMyPhoto(file: Blob): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/me/photo', { method: 'POST', body: file });
}

export function deleteMyPhoto(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/me/photo', { method: 'DELETE' });
}

/**
 * Where to read a profile picture. Phoenix-MS caches it privately for a
 * minute, so a version stamp is appended to show a freshly uploaded one at
 * once. A user with no photo answers 404 — the caller falls back to initials.
 */
export function photoUrl(userId: number, version: number | string = ''): string {
  return `/api/users/${userId}/photo${version === '' ? '' : `?v=${version}`}`;
}
