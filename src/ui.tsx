import React, { createContext, useContext } from 'react';
import type { Locale } from './strings';
import type { AcademicLevelCode } from './types/levelIdentity';
import type { PhoenixUser } from './types/phoenixUser';
import type { PortalBundle } from './types/portal';

export type Role = 'student' | 'parent';
export type DataState = 'full' | 'loading' | 'empty' | 'error' | 'offline';
export type ToastTone = 'info' | 'success' | 'warning';

export interface PushedScreen {
  key: string;
  node: React.ReactNode;
  backTitle: string;
}

export interface SheetRequest {
  key: string;
  node: React.ReactNode;
  detent?: 'medium' | 'large';
}

export interface UIApi {
  role: Role;
  /** Authenticated Phoenix-MS account; null until sign-in completes. */
  user: PhoenixUser | null;
  /**
   * Every child this login may see, from Phoenix-MS. A student login holds
   * exactly one entry (themselves); a parent holds one per child. null while
   * the portal data is still loading or the request failed.
   */
  portalChildren: PortalBundle[] | null;
  /** The child the screens are currently showing — follows activeChildId. */
  activeChild: PortalBundle | null;
  /** Re-fetch the portal data (after a change, or to retry a failed load). */
  reloadPortal: () => void;
  /** Re-read the signed-in account — used after a profile photo changes. */
  refreshUser: () => void;
  /** Locks the session on Phoenix-MS and raises the lock screen. */
  lockNow: () => void;
  /** Re-reads whether quick unlock is on — call after enrolling or removing it. */
  refreshBiometrics: () => void;
  dataState: DataState;
  /**
   * True while the family's tuition payment is overdue — locks the game.
   * Games feature temporarily disabled (see src/config.ts), so nothing reads
   * this today. Kept on the contract for reactivation.
   */
  gameLocked: boolean;
  activeChildId: number;
  setActiveChildId: (id: number) => void;
  push: (screen: PushedScreen) => void;
  pop: () => void;
  openSheet: (sheet: SheetRequest) => void;
  closeSheet: () => void;
  openFullScreen: (node: React.ReactNode) => void;
  closeFullScreen: () => void;
  toast: (message: string, tone?: ToastTone) => void;
  goToTab: (tab: number) => void;
  logout: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  unreadCount: number;
  markAllRead: () => void;
  language: Locale;
  setLanguage: (l: Locale) => void;
  studentLevel: AcademicLevelCode;
  setStudentLevel: (l: AcademicLevelCode) => void;
}

export const UIContext = createContext<UIApi | null>(null);

export function useUI(): UIApi {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIContext');
  return ctx;
}