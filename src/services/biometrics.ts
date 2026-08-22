/**
 * Biometric device gate.
 *
 * WHAT THIS IS: a check that the person holding this device is its owner,
 * performed by the platform's own hardware — Face ID / Touch ID on iOS, a
 * Class 3 sensor on Android, Windows Hello on a PC. The app never sees a face
 * or a fingerprint; the operating system answers yes or no.
 *
 * WHAT THIS IS NOT: proof to Phoenix-MS. The CRM decides whether a session is
 * still allowed (sign-out, device revoke, forced password change, a
 * deactivated account); this gate only decides whether to reveal a session the
 * device already holds. Keeping the two apart is deliberate — see the notes in
 * App.tsx. Nothing here is a substitute for the server-side lock, which still
 * asks for the account password.
 *
 * WHY WEBAUTHN: a camera-based face matcher in JavaScript sees a flat RGB
 * image and is opened by a printed photo or a phone screen. WebAuthn hands the
 * question to the platform authenticator instead, which on an iPhone is the
 * real Face ID hardware, with its real anti-spoofing. `userVerification:
 * "required"` is what forces it: Android performs user verification only with
 * a strong (Class 3) biometric or the device credential, never with the weak
 * 2D face unlock that a photo defeats.
 *
 * MOVING TO REACT NATIVE: this file is the only place that talks to the
 * platform. Swap the four functions for `expo-local-authentication`
 * (`hasHardwareAsync`, `isEnrolledAsync`, `authenticateAsync`) and everything
 * that imports them keeps working. There, ask for the strong class explicitly
 * and keep `disableDeviceFallback` false so a passcode still works.
 */

const STORE_KEY = 'phoenix.biometric.v1';
/** Same host the session cookie belongs to, so a credential cannot be reused elsewhere. */
const RP_NAME = 'Phoenix Math School';

type Enrolments = Record<string, string>;

function readStore(): Enrolments {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) as Enrolments : {};
  } catch {
    return {};
  }
}

function writeStore(next: Enrolments): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the gate simply stays off */
  }
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {binary += String.fromCharCode(b);});
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = window.atob(padded + '==='.slice((padded.length + 3) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function randomChallenge(): ArrayBuffer {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return bytes.buffer;
}

/** The account id as bytes — WebAuthn wants a handle, not a number. */
function userHandle(userId: number): ArrayBuffer {
  const text = String(userId);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes.buffer;
}

/** Does this device have a biometric (or device-credential) authenticator built in? */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Has this account already turned the gate on, on this device? */
export function isBiometricEnrolled(userId: number): boolean {
  return typeof readStore()[String(userId)] === 'string';
}

/**
 * Turns the gate on for this account on this device. The private key never
 * leaves the platform authenticator; only its public identifier is kept here,
 * and that identifier is not a secret.
 */
export async function enrollBiometrics(userId: number, userName: string): Promise<boolean> {
  if (!(await isBiometricSupported())) return false;
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: RP_NAME },
      user: {
        id: userHandle(userId),
        name: userName,
        displayName: userName
      },
      // ES256 first, RS256 as the fallback some authenticators still need.
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: {
        // The sensor built into this device — never a roaming key.
        authenticatorAttachment: 'platform',
        // Forces a real identity check, which is what rules out Android's weak
        // 2D face unlock: it cannot satisfy user verification.
        userVerification: 'required',
        residentKey: 'discouraged'
      },
      timeout: 60000,
      attestation: 'none'
    }
  }) as PublicKeyCredential | null;

  if (!credential) return false;
  writeStore({ ...readStore(), [String(userId)]: toBase64Url(credential.rawId) });
  return true;
}

/**
 * Asks the platform to confirm the owner. Resolves false when they cancel, and
 * also when the stored credential no longer works — which is what happens
 * after the device's enrolled faces or fingerprints change. The caller then
 * falls back to the password, which is the safe answer.
 */
export async function verifyBiometrics(userId: number): Promise<boolean> {
  const stored = readStore()[String(userId)];
  if (!stored) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(stored) }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    return assertion !== null;
  } catch {
    return false;
  }
}

/** Turns the gate off for this account on this device. */
export function forgetBiometrics(userId: number): void {
  const store = readStore();
  delete store[String(userId)];
  writeStore(store);
}
