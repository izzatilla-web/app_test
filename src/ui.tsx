import React, { createContext, useContext } from 'react';
import type { Locale } from './strings';

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
}

export const UIContext = createContext<UIApi | null>(null);

export function useUI(): UIApi {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIContext');
  return ctx;
}