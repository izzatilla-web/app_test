import React, { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import {
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarPlusIcon,
  Gamepad2Icon,
  HouseIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon } from
'lucide-react';
import { TabBar } from './components/TabBar';
import type { TabItem } from './components/TabBar';
import { Toast } from './components/Toast';
import { Splash } from './screens/Splash';
import { SignIn } from './screens/SignIn';
import { NewPassword } from './screens/NewPassword';
import { BiometricSetup } from './screens/BiometricSetup';
import { PinLock } from './screens/PinLock';
import { StudentToday } from './screens/StudentToday';
import { StudentLessons } from './screens/StudentLessons';
import { StudentBookings } from './screens/StudentBookings';
import { StudentProgress } from './screens/StudentProgress';
import { StudentProfile } from './screens/StudentProfile';
import { ParentToday } from './screens/ParentToday';
import { ParentAttendance } from './screens/ParentAttendance';
import { ParentPayments } from './screens/ParentPayments';
import { ParentProgress } from './screens/ParentProgress';
import { ParentProfile } from './screens/ParentProfile';
import { DevPanel } from './components/DevPanel';
import { UIContext } from './ui';
import type { DataState, PushedScreen, Role, SheetRequest, ToastTone, UIApi } from './ui';
import { t, loadStoredLocale, setLocale } from './strings';
import type { Locale } from './strings';
import { parent, student } from './mockData';
import { GAMES_ENABLED } from './config';

import type { AcademicLevelCode } from './types/levelIdentity';

type AuthStep = 'splash' | 'pin' | 'signin' | 'password' | 'biometric';

/* ── Games feature ───────────────────────────────────────────────
   Temporarily disabled for this release — see src/config.ts.
   The implementation is kept intact but loaded lazily, so while
   GAMES_ENABLED is false no game module is imported, initialised or
   executed. Flip the flag to restore the tab, the route and every
   game screen. */

/** Student tab id owned by the Games feature. */
const GAMES_TAB = 2;
/** Where a blocked games route lands instead. */
const GAMES_FALLBACK_TAB = 1;

const StudentArena = GAMES_ENABLED ?
lazy(() => import('./screens/StudentArena').then((m) => ({ default: m.StudentArena }))) :
null;

/** Route guard — the games tab is unreachable while the feature is disabled. */
function resolveTab(next: number, role: Role): number {
  if (!GAMES_ENABLED && role === 'student' && next === GAMES_TAB) return GAMES_FALLBACK_TAB;
  return next;
}

export function App() {
  const [dark, setDark] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [dataState, setDataState] = useState<DataState>('full');
  const [failNext, setFailNext] = useState(false);
  /* Games-only: tuition-overdue lock read by the game screens. Inert while
     GAMES_ENABLED is false; kept so the feature reactivates unchanged. */
  const [gameLocked, setGameLocked] = useState(false);

  const [mode, setMode] = useState<'auth' | 'app'>('auth');
  const [authStep, setAuthStep] = useState<AuthStep>('splash');
  const [pinEnabled, setPinEnabled] = useState(false);

  const [tab, setTab] = useState(1);
  const [stack, setStack] = useState<PushedScreen[]>([]);
  const [sheet, setSheet] = useState<SheetRequest | null>(null);
  const [fullScreen, setFullScreen] = useState<React.ReactNode | null>(null);
  const [toastState, setToastState] = useState<{message: string;tone: ToastTone;leaving: boolean;} | null>(null);
  const [activeChildId, setActiveChildId] = useState(1);
  const [unreadCount, setUnreadCount] = useState(2);
  const [language, setLanguageState] = useState<Locale>(loadStoredLocale);
  const [studentLevel, setStudentLevelState] = useState<AcademicLevelCode>(() => {
    return (localStorage.getItem('student_academic_level') as AcademicLevelCode) || (student.level as AcademicLevelCode) || 'A2';
  });
  const [scrollSignals, setScrollSignals] = useState<Record<number, number>>({});
  const toastTimer = useRef<number | null>(null);
  const toastExitTimer = useRef<number | null>(null);
  const edgeStart = useRef<number | null>(null);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    if (toastExitTimer.current) window.clearTimeout(toastExitTimer.current);
    setToastState({ message, tone, leaving: false });
    toastTimer.current = window.setTimeout(() => {
      setToastState((prev) => prev ? { ...prev, leaving: true } : null);
      toastExitTimer.current = window.setTimeout(() => setToastState(null), 300);
    }, 2400);
  }, []);

  const setLanguage = useCallback((next: Locale) => {
    setLocale(next);
    setLanguageState(next);
  }, []);

  const setStudentLevel = useCallback((l: AcademicLevelCode) => {
    localStorage.setItem('student_academic_level', l);
    student.level = l;
    setStudentLevelState(l);
  }, []);

  const pop = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);

  const api: UIApi = useMemo(
    () => ({
      role,
      dataState,
      gameLocked,
      activeChildId,
      setActiveChildId,
      push: (screen) => setStack((prev) => [...prev, screen]),
      pop,
      openSheet: (request) => setSheet(request),
      closeSheet: () => setSheet(null),
      openFullScreen: (node) => setFullScreen(node),
      closeFullScreen: () => setFullScreen(null),
      toast,
      goToTab: (next) => {
        setStack([]);
        setTab(resolveTab(next, role));
      },
      logout: () => {
        setMode('auth');
        setAuthStep('signin');
        setStack([]);
        setTab(1);
      },
      dark,
      setDark,
      unreadCount,
      markAllRead: () => setUnreadCount(0),
      language,
      setLanguage,
      studentLevel,
      setStudentLevel
    }),
    [role, dataState, gameLocked, activeChildId, dark, unreadCount, language, studentLevel, pop, toast, setLanguage, setStudentLevel]
  );

  /* Games disabled → the O'yin tab is left out. Tab ids stay stable so the
     remaining tabs (and every ui.goToTab call targeting them) are unaffected;
     TabBar sizes its items with flex-1, so spacing rebalances on its own. */
  const gameTab: TabItem[] = GAMES_ENABLED ?
  [{ id: GAMES_TAB, label: t.tabGame, icon: Gamepad2Icon }] :
  [];

  const tabs: TabItem[] =
  role === 'student' ?
  [
  { id: 1, label: t.tabToday, icon: HouseIcon },
  ...gameTab,
  { id: 3, label: t.tabLessons, icon: BookOpenIcon },
  { id: 4, label: t.tabBookings, icon: CalendarPlusIcon },
  { id: 5, label: t.tabProgress, icon: TrendingUpIcon },
  { id: 6, label: t.tabProfile, icon: UserIcon }] :

  [
  { id: 1, label: t.tabToday, icon: HouseIcon },
  { id: 2, label: t.tabAttendance, icon: CalendarCheckIcon },
  { id: 3, label: t.tabPayments, icon: WalletIcon },
  { id: 4, label: t.tabProgress, icon: TrendingUpIcon },
  { id: 5, label: t.tabProfile, icon: UserIcon }];


  function selectTab(id: number) {
    const next = resolveTab(id, role);
    if (next === tab && stack.length === 0) {
      setScrollSignals((prev) => ({ ...prev, [next]: (prev[next] ?? 0) + 1 }));
      return;
    }
    setStack([]);
    setTab(next);
  }

  const signal = scrollSignals[tab] ?? 0;

  const tabScreen = useMemo(() => {
    if (role === 'student') {
      switch (tab) {
        case 1:
          return <StudentToday scrollSignal={signal} />;
        case GAMES_TAB:
          /* Guarded by resolveTab; the fallback also keeps a stale tab id from
             reaching the arena while Games are disabled. */
          return StudentArena ?
          <StudentArena scrollSignal={signal} /> :
          <StudentToday scrollSignal={signal} />;
        case 3:
          return <StudentLessons scrollSignal={signal} />;
        case 4:
          return <StudentBookings scrollSignal={signal} />;
        case 5:
          return <StudentProgress scrollSignal={signal} />;
        default:
          return <StudentProfile scrollSignal={signal} />;
      }
    }
    switch (tab) {
      case 1:
        return <ParentToday scrollSignal={signal} />;
      case 2:
        return <ParentAttendance scrollSignal={signal} />;
      case 3:
        return <ParentPayments scrollSignal={signal} />;
      case 4:
        return <ParentProgress scrollSignal={signal} />;
      default:
        return <ParentProfile scrollSignal={signal} />;
    }
  }, [role, tab, signal]);

  function renderAuth() {
    switch (authStep) {
      case 'splash':
        return <Splash onDone={() => setAuthStep(pinEnabled ? 'pin' : 'signin')} />;
      case 'pin':
        return (
          <PinLock
            name={role === 'student' ? student.firstName : parent.firstName}
            seed={role === 'student' ? student.id : 9}
            onUnlock={() => setMode('app')} />);


      case 'signin':
        return (
          <SignIn
            failNext={failNext}
            language={language}
            setLanguage={setLanguage}
            onSuccess={(nextRole) => {
              setRole(nextRole);
              setAuthStep('password');
            }} />);


      case 'password':
        return <NewPassword onDone={() => setAuthStep('biometric')} />;
      default:
        return (
          <BiometricSetup
            onEnable={() => {
              setPinEnabled(true);
              setMode('app');
            }}
            onPin={() => {
              setPinEnabled(true);
              setMode('app');
            }}
            onSkip={() => setMode('app')} />);


    }
  }

  const sheetOpen = sheet !== null;

  return (
    <UIContext.Provider value={api}>
      <div className={['h-full w-full', dark ? 'dark' : ''].join(' ')}>
        <div className="relative h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-200 ease-out">
          {mode === 'auth' ?
          renderAuth() :

          <>
              <div
              className="h-full w-full origin-bottom overflow-hidden"
              style={{
                transform: sheetOpen ? 'scale(0.94) translateY(-10px)' : 'none',
                borderRadius: sheetOpen ? 20 : 0,
                transition: 'transform 400ms cubic-bezier(0.32,0.72,0,1), border-radius 400ms'
              }}>

                <div key={`${role}-${tab}`} className="fade-in h-full w-full">
                  {/* Boundary for the lazily loaded games tab. Inert while
                      GAMES_ENABLED is false — nothing here suspends. */}
                  <Suspense fallback={<div className="h-full w-full bg-background" />}>
                    {tabScreen}
                  </Suspense>
                </div>

                {stack.map((screen, i) =>
              <div
                key={screen.key}
                className="push-in absolute inset-0 z-40 bg-background"
                style={{ zIndex: 40 + i }}
                onPointerDown={(e) => {
                  if (e.clientX - e.currentTarget.getBoundingClientRect().left < 24) {
                    edgeStart.current = e.clientX;
                  }
                }}
                onPointerUp={(e) => {
                  if (edgeStart.current !== null && e.clientX - edgeStart.current > 70) pop();
                  edgeStart.current = null;
                }}>

                    {screen.node}
                  </div>
              )}

                {stack.length === 0 &&
              <TabBar items={tabs} active={tab} onSelect={selectTab} />
              }
              </div>

              {sheet && <div key={sheet.key}>{sheet.node}</div>}
              {fullScreen}
            </>
          }

          {toastState &&
          <Toast
            message={toastState.message}
            tone={toastState.tone}
            leaving={toastState.leaving} />

          }
        </div>
      </div>

      <DevPanel
        dark={dark}
        setDark={setDark}
        role={role}
        setRole={(next) => {
          setRole(next);
          setTab(1);
          setStack([]);
          setSheet(null);
        }}
        dataState={dataState}
        setDataState={setDataState}
        gameLocked={gameLocked}
        setGameLocked={setGameLocked}
        failNext={failNext}
        setFailNext={setFailNext}
        studentLevel={studentLevel}
        setStudentLevel={setStudentLevel}
        onRestart={() => {
          setMode('auth');
          setAuthStep('splash');
          setStack([]);
          setSheet(null);
          setTab(1);
        }} />

    </UIContext.Provider>);

}