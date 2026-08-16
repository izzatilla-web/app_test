/**
 * Tiny Web Audio synth for game feedback sounds.
 * No audio files — everything is generated, so it works offline.
 * All triggers happen inside user-gesture handlers, so autoplay policies are satisfied.
 */

let ctx: AudioContext | null = null;
let muted = false;

export function setSoundMuted(value: boolean): void {
  muted = value;
}

export function isSoundMuted(): boolean {
  return muted;
}

function ensure(): AudioContext | null {
  if (muted) return null;
  try {
    const AC =
    window.AudioContext ??
    (window as unknown as {webkitAudioContext?: typeof AudioContext;}).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
freq: number,
startDelay: number,
duration: number,
type: OscillatorType,
peak: number,
glideTo?: number)
: void {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + startDelay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export const sound = {
  /** soft UI tap */
  tap(): void {
    tone(600, 0, 0.05, 'triangle', 0.05);
  },
  /** option selected */
  select(): void {
    tone(880, 0, 0.06, 'triangle', 0.06);
  },
  /** correct answer — bright two-note chime */
  correct(): void {
    tone(659.25, 0, 0.12, 'sine', 0.12);
    tone(987.77, 0.09, 0.2, 'sine', 0.12);
  },
  /** wrong answer — soft low thud, not a harsh buzz */
  wrong(): void {
    tone(220, 0, 0.16, 'sine', 0.06, 150);
    tone(130, 0.08, 0.2, 'sine', 0.045);
  },
  /** single tick while numbers count up */
  tick(): void {
    tone(1318, 0, 0.025, 'triangle', 0.02);
  },
  /** coin received — soft chime */
  coin(): void {
    tone(1568, 0, 0.07, 'triangle', 0.05);
    tone(2093, 0.06, 0.12, 'triangle', 0.05);
  },
  /** purchase confirmed — gentle two-tone settle */
  purchase(): void {
    tone(659.25, 0, 0.1, 'sine', 0.07);
    tone(880, 0.09, 0.16, 'sine', 0.07);
    tone(1174.66, 0.2, 0.24, 'sine', 0.05);
  },
  /** party popper — sharp paper crack, low thump, tiny sparkle tail */
  pop(): void {
    const c = ensure();
    if (!c) return;
    // crack: short white-noise burst swept through a falling bandpass
    const t0 = c.currentTime;
    const len = Math.floor(c.sampleRate * 0.07);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(1800, t0);
    bp.frequency.exponentialRampToValueAtTime(500, t0 + 0.07);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.22, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(c.destination);
    src.start(t0);
    src.stop(t0 + 0.1);
    // body + sparkle
    tone(190, 0, 0.16, 'sine', 0.1, 70);
    tone(1568, 0.12, 0.1, 'triangle', 0.05);
    tone(2093, 0.2, 0.14, 'triangle', 0.045);
    tone(2637, 0.27, 0.18, 'sine', 0.035);
  },
  /** results fanfare */
  fanfare(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, i * 0.11, 0.22, 'triangle', 0.09)
    );
    tone(1318.5, 0.46, 0.42, 'sine', 0.07);
  },
  /** whoosh for level-up / streak */
  whoosh(): void {
    tone(300, 0, 0.3, 'sine', 0.06, 1200);
  },
  /** countdown beep (3‑2‑1) */
  beep(): void {
    tone(740, 0, 0.12, 'sine', 0.09);
  },
  /** battle START hit */
  start(): void {
    tone(300, 0, 0.26, 'sine', 0.08, 1400);
    tone(523.25, 0.1, 0.3, 'triangle', 0.1);
    tone(783.99, 0.2, 0.34, 'triangle', 0.1);
  },
  /** a player joined the lobby */
  join(): void {
    tone(980, 0, 0.05, 'triangle', 0.05);
    tone(1240, 0.05, 0.07, 'triangle', 0.05);
  }
};
