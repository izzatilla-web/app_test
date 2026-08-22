/**
 * Central HTTP client for Phoenix-MS.
 *
 * Phoenix-MS authenticates with an httpOnly session cookie (phoenix.sid,
 * sameSite=strict) and rejects cross-origin mutating requests, so in
 * development the app reaches it through the Vite proxy (see vite.config.ts)
 * and every path here stays relative. VITE_API_BASE_URL exists for a
 * same-site production setup; it must never point at a foreign origin.
 *
 * There is no mock fallback on this path — HTTP errors, timeouts and network
 * failures all surface as ApiError.
 */

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  /** HTTP status; 0 = timeout or network failure (no response at all). */
  status: number;
  /** Machine code Phoenix-MS attaches to some 403s (e.g. MUST_CHANGE_PASSWORD). */
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let onLocked: UnauthorizedHandler | null = null;

/** App.tsx registers what happens when an authenticated call answers 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/**
 * Registers what happens when Phoenix-MS answers 403 `{code:"LOCKED"}` — the
 * session is locked server-side and the app must show its lock screen, even if
 * the lock was set from another device.
 */
export function setLockedHandler(handler: UnauthorizedHandler | null): void {
  onLocked = handler;
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /**
   * Sent as JSON, unless it is a Blob or File — Phoenix-MS takes a profile
   * photo as raw image bytes, so those go up untouched with the browser's own
   * content type.
   */
  body?: unknown;
  /**
   * 'global' (default): a 401 also invalidates the client session through the
   * registered handler. 'silent': the caller owns the 401 (login itself, the
   * bootstrap /me probe, logout).
   */
  on401?: 'global' | 'silent';
}

/** JSON request/response against Phoenix-MS. Throws ApiError on any failure. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, on401 = 'global' } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const isBinary = typeof Blob !== 'undefined' && body instanceof Blob;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers:
      body === undefined || isBinary ? undefined : { 'Content-Type': 'application/json' },
      body:
      body === undefined ? undefined : isBinary ? body as Blob : JSON.stringify(body),
      // Session cookie auth — phoenix.sid must ride along on every call.
      credentials: 'include',
      signal: controller.signal
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'AbortError';
    throw new ApiError(0, timedOut ? 'Request timed out' : 'Network request failed');
  } finally {
    window.clearTimeout(timer);
  }

  const contentType = res.headers.get('content-type') || '';
  // Logout answers 200 with a text/plain "OK" body — only parse real JSON.
  const payload: any = contentType.includes('application/json') ?
  await res.json().catch(() => null) :
  null;

  // Failures are read by status first. Phoenix-MS sends some of them as plain
  // text rather than JSON (`res.status(401).send("Unauthorized")`), so the
  // HTML check below must not swallow them — a 401 has to stay a 401 or the
  // session is never invalidated.
  if (!res.ok) {
    if (res.status === 401 && on401 === 'global' && onUnauthorized) onUnauthorized();
    if (res.status === 403 && payload && payload.code === 'LOCKED' && onLocked) onLocked();
    const message =
    payload && typeof payload.message === 'string' ?
    payload.message :
    `Request failed (${res.status})`;
    const code = payload && typeof payload.code === 'string' ? payload.code : undefined;
    throw new ApiError(res.status, message, code);
  }

  // A SUCCESSFUL API call that answers HTML never came from Phoenix-MS: in dev
  // it means the request missed the proxy and Vite served index.html. Fail
  // loudly, or the caller silently receives null and the screen breaks far
  // from the cause.
  if (contentType.includes('text/html')) {
    throw new ApiError(0, `${path} did not reach Phoenix-MS (got HTML). Check the Vite proxy.`);
  }

  return payload as T;
}
