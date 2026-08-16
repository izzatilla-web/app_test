/**
 * Avatar persistence — the app's storage mechanism is localStorage
 * (same pattern as the locale in strings.ts). Configs are keyed by the
 * same numeric seed the <Avatar> component already uses to identify a
 * person, so every existing call site can pick up a saved avatar.
 *
 * A tiny external store + useSyncExternalStore keeps all mounted avatars
 * in sync the moment a config is saved, with no extra dependencies.
 */

import { useSyncExternalStore } from 'react';
import type { AvatarConfig } from './avatarTypes';
import { sanitizeAvatarConfig } from './avatarOptions';

const STORAGE_KEY = 'phoenix.avatars.v1';

type AvatarMap = Record<string, AvatarConfig>;

let cache: AvatarMap = load();
/** Bumped on every save — lets the profile re-run its entrance animation. */
let version = 0;
const listeners = new Set<() => void>();

function load(): AvatarMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: AvatarMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value) out[key] = sanitizeAvatarConfig(value);
    }
    return out;
  } catch {
    return {};
  }
}

function emit(): void {
  version += 1;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAvatarConfig(seed: number): AvatarConfig | null {
  return cache[String(seed)] ?? null;
}

export function getAvatarVersion(): number {
  return version;
}

/**
 * Persists a config. Throws if storage is unavailable so the studio can
 * show its error state while keeping the draft intact.
 */
export function saveAvatarConfig(seed: number, config: AvatarConfig): void {
  const clean = sanitizeAvatarConfig(config);
  const next = { ...cache, [String(seed)]: clean };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cache = next;
  emit();
}

/** Subscribes a component to one person's saved avatar. */
export function useAvatarConfig(seed: number): AvatarConfig | null {
  return useSyncExternalStore(subscribe, () => cache[String(seed)] ?? null);
}

/** Subscribes to the global save counter (used for entrance animations). */
export function useAvatarVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}
