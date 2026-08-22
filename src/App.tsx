import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ScreenLock } from './screens/ScreenLock';
import { BiometricGate } from './screens/BiometricGate';
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
import { ApiError, setLockedHandler, setUnauthorizedHandler } from './services/http';
import { changePassword, fetchMe, lockSession, login, logout as apiLogout, unlockSession } from './services/authApi';
import { getMyChildren, getMyStudent } from './services/portalApi';
import { isBiometricEnrolled, isBiometricSupported, verifyBiometrics } from './services/biometrics';
import { isPortalRole } from './types/phoenixUser';
import type { PhoenixUser } from './types/phoenixUser';
import type { PortalBundle } from './types/portal';

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

/** Idle time before the app asks Phoenix-MS to lock the session. */
const AUTO_LOCK_MS = 5 * 60 * 1000;

/** How long away from the app before it asks for a face again on return. */
const AWAY_GATE_MS = 60 * 1000;

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
  /** Authenticated Phoenix-MS account. The session itself lives in the httpOnly phoenix.sid cookie. */
  const [user, setUser] = useState<PhoenixUser | null>(null);
  /** 'pending' until the GET /api/auth/me probe settles on app start. */
  const [bootstrap, setBootstrap] = useState<'pending' | 'authed' | 'anon'>('pending');
  const [splashDone, setSplashDone] = useState(false);
  /** The family's own records from Phoenix-MS; null while loading or after a failed load. */
  const [portalChildren, setPortalChildren] = useState<PortalBundle[] | null>(null);
  /** Bumping this re-runs the portal load. */
  const [portalReload, setPortalReload] = useState(0);
  /** True while Phoenix-MS holds this session locked — password to get back. */
  const [locked, setLocked] = useState(false);
  /**
   * The device gate: shown after the app has been idle, opened by the phone's
   * own face or fingerprint check. A lighter thing than the lock above — it
   * reveals a session Phoenix-MS already granted, and a refusal escalates to
   * the server lock rather than opening anything.
   */
  const [gated, setGated] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  /** Bumped when the profile turns quick unlock on or off. */
  const [biometricTick, setBiometricTick] = useState(0);
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

  /** Drop all client auth state and land on the sign-in screen. */
  const resetToSignIn = useCallback(() => {
    setUser(null);
    setPortalChildren(null);
    setLocked(false);
    setGated(false);
    setMode('auth');
    setAuthStep('signin');
    setStack([]);
    setSheet(null);
    setFullScreen(null);
    setTab(1);
  }, []);

  /* ── Session bootstrap ──
     On mount ask Phoenix-MS who owns the phoenix.sid cookie (if anyone). The
     splash stays up until both the brand moment and this probe finish. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe({ on401: 'silent' });
        if (cancelled) return;
        if (me && isPortalRole(me.role)) {
          setUser(me);
          setRole(me.role);
          /* A session locked before the app was closed stays locked — the lock
             screen asks for the password, exactly as Phoenix-MS does. Signing
             the family out instead would throw away a valid session and force a
             full sign-in for the same password. */
          setLocked(!!me.locked);
          setBootstrap('authed');
        } else {
          setBootstrap('anon');
        }
      } catch {
        // Server unreachable — the sign-in attempt will surface the error.
        if (!cancelled) setBootstrap('anon');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Route out of the splash once the timer and the session probe both settle. */
  useEffect(() => {
    if (!splashDone || bootstrap === 'pending' || mode !== 'auth' || authStep !== 'splash') return;
    if (bootstrap === 'authed' && user) {
      if (user.mustChangePassword) {
        setAuthStep('password');
      } else {
        /* Quick unlock stands between a live session and the screens, the way
           a banking app asks the moment it opens. Read straight from storage:
           the async support probe may not have answered yet. */
        if (isBiometricEnrolled(user.id)) setGated(true);
        setMode('app');
      }
    } else {
      setAuthStep(pinEnabled ? 'pin' : 'signin');
    }
  }, [splashDone, bootstrap, mode, authStep, user, pinEnabled]);

  /* A 401 on any authenticated call means the server session is gone —
     invalidate the client state instead of showing stale protected data.
     A 403 LOCKED means the session is locked (possibly from another device),
     so the lock screen goes up over whatever is on screen. */
  useEffect(() => {
    setUnauthorizedHandler(resetToSignIn);
    setLockedHandler(() => setLocked(true));
    return () => {
      setUnauthorizedHandler(null);
      setLockedHandler(null);
    };
  }, [resetToSignIn]);

  /* Is the quick unlock usable here — hardware present and this account enrolled? */
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setBiometricReady(false);
      return;
    }
    isBiometricSupported().
    then((supported) => {
      if (!cancelled) setBiometricReady(supported && isBiometricEnrolled(user.id));
    }).
    catch(() => {
      if (!cancelled) setBiometricReady(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, biometricTick]);

  /** Locks the session on the server, then raises the lock screen. */
  const lockNow = useCallback(async () => {
    try {
      await lockSession();
    } catch {
      /* Even if the call fails the screen still locks — the next request will
         be refused anyway if the server did take it. */
    }
    setLocked(true);
  }, []);

  /* After a spell of inactivity the app closes itself.
     · quick unlock on  → the device gate, opened by face or fingerprint
     · quick unlock off → the server lock, opened by the account password
     Phoenix-MS has no portal endpoint for the timeout, so the timer lives here. */
  useEffect(() => {
    if (mode !== 'app' || locked || gated) return;
    const close = () => {
      if (biometricReady) setGated(true);else
      lockNow();
    };
    let timer = window.setTimeout(close, AUTO_LOCK_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(close, AUTO_LOCK_MS);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'focus'];
    events.forEach((name) => window.addEventListener(name, bump));
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, bump));
    };
  }, [mode, locked, gated, biometricReady, lockNow]);

  /* Away and back: a phone keeps the page alive while the user is in another
     app, so the idle timer above never fires. Ask again when they return. */
  useEffect(() => {
    if (mode !== 'app') return;
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (!hiddenAt || Date.now() - hiddenAt < AWAY_GATE_MS) return;
      hiddenAt = 0;
      if (user && isBiometricEnrolled(user.id)) setGated(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [mode, user]);

  /** Unlocks against Phoenix-MS. Returns a message to show, or null. */
  const handleUnlock = useCallback(async (password: string): Promise<string | null> => {
    try {
      await unlockSession(password);
    } catch (err) {
      if (err instanceof ApiError) {
        // Five wrong tries end the session outright — back to sign-in.
        if (err.code === 'SESSION_ENDED') {
          resetToSignIn();
          setLocked(false);
          return null;
        }
        if (err.status === 0) return t.authErrNetwork;
        /* The CRM answers in English; the one a family can act on is shown in
           their language, anything else in the server's own words. */
        if (/wrong password/i.test(err.message)) return t.lockWrongPassword;
        return err.message || t.authErrGeneric;
      }
      return t.authErrGeneric;
    }
    setLocked(false);
    /* Anything asked for while the session was locked came back 403, so the
       family data is empty behind this screen — read it again on the way in. */
    setPortalReload((n) => n + 1);
    return null;
  }, [resetToSignIn]);

  /* ── Portal data ──
     The family's own records, straight from Phoenix-MS. A student login gets
     exactly one bundle (themselves); a parent gets one per child. The server
     scopes this by session, so no student id is sent from here. */
  useEffect(() => {
    if (!user || !isPortalRole(user.role) || mode !== 'app') return;
    let cancelled = false;
    setDataState('loading');
    (async () => {
      try {
        const bundles = user.role === 'parent' ? await getMyChildren() : [await getMyStudent()];
        if (cancelled) return;
        setPortalChildren(bundles);
        /* The CRM's own order decides which child the portal opens on. */
        if (bundles[0]) setActiveChildId(bundles[0].student.id);
        setDataState(bundles.length === 0 ? 'empty' : 'full');
      } catch {
        if (cancelled) return;
        setPortalChildren(null);
        setDataState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, mode, portalReload]);

  /** Real sign-in against Phoenix-MS. Returns a localized error message, or null on success. */
  const handleLogin = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const result = await login(username, password);
      if (result.kind === 'needsCode') return t.authErrCode;
      const nextUser = result.user;
      if (!isPortalRole(nextUser.role)) {
        // The server did open a session for this staff account — end it; the
        // app has no staff screens.
        apiLogout().catch(() => undefined);
        return t.authErrRole;
      }
      setUser(nextUser);
      setRole(nextUser.role);
      setAuthStep(nextUser.mustChangePassword ? 'password' : 'biometric');
      return null;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return t.authError;
        if (err.status === 429) return t.authErrTooMany;
        if (err.status === 0) return t.authErrNetwork;
      }
      return t.authErrGeneric;
    }
  }, []);

  /** Phoenix-MS demands consent on the first self-set password of a portal account. */
  const needsConsent = !!(user && isPortalRole(user.role) && !user.consentAt);

  /** Forced first-password change. Returns an error message, or null on success. */
  const handlePasswordChange = useCallback(async (newPassword: string): Promise<string | null> => {
    try {
      await changePassword({ newPassword, ...(needsConsent ? { consent: true } : {}) });
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) return t.authErrNetwork;
      if (err instanceof ApiError && err.status === 400) return err.message || t.pwError;
      return t.pwError;
    }
    // Refresh the account so mustChangePassword/consentAt reflect the server.
    const me = await fetchMe({ on401: 'silent' }).catch(() => null);
    setUser((prev) => {
      if (me && isPortalRole(me.role)) return me;
      return prev ? { ...prev, mustChangePassword: false } : prev;
    });
    setAuthStep('biometric');
    return null;
  }, [needsConsent]);

  const api: UIApi = useMemo(
    () => ({
      role,
      user,
      portalChildren,
      activeChild:
      portalChildren?.find((c) => c.student.id === activeChildId) ?? portalChildren?.[0] ?? null,
      reloadPortal: () => setPortalReload((n) => n + 1),
      lockNow,
      refreshBiometrics: () => setBiometricTick((n) => n + 1),
      refreshUser: () => {
        fetchMe({ on401: 'silent' }).
        then((me) => {
          if (me && isPortalRole(me.role)) setUser(me);
        }).
        catch(() => undefined);
      },
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
        // Destroy the server session (clears the phoenix.sid cookie). Client
        // state resets regardless; a failure only means the cookie survives,
        // so surface it.
        apiLogout().catch(() => toast(t.authErrNetwork, 'warning'));
        resetToSignIn();
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
    [role, user, portalChildren, dataState, gameLocked, activeChildId, dark, unreadCount, language, studentLevel, pop, toast, setLanguage, setStudentLevel, resetToSignIn, lockNow]
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
        return <Splash onDone={() => setSplashDone(true)} />;
      case 'pin':
        return (
          <PinLock
            name={user?.firstName || (role === 'student' ? student.firstName : parent.firstName)}
            seed={user?.id ?? (role === 'student' ? student.id : 9)}
            onUnlock={() => setMode('app')} />);


      case 'signin':
        return (
          <SignIn
            language={language}
            setLanguage={setLanguage}
            onLogin={handleLogin} />);


      case 'password':
        return <NewPassword needsConsent={needsConsent} onSubmit={handlePasswordChange} />;
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

              {/* Device gate: the quick way back in after idling. */}
              {gated && !locked && user &&
            <BiometricGate
              name={user.firstName || user.username}
              onVerify={() => verifyBiometrics(user.id)}
              onPass={() => setGated(false)}
              onUsePassword={() => {
                setGated(false);
                lockNow();
              }} />
            }

              {/* Server-side lock: covers the app until Phoenix-MS accepts the password. */}
              {locked &&
            <ScreenLock
              name={user?.firstName || user?.username || ''}
              onUnlock={handleUnlock}
              onSignOut={() => {
                apiLogout().catch(() => undefined);
                resetToSignIn();
              }} />
            }
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
        studentLevel={studentLevel}
        setStudentLevel={setStudentLevel}
        onRestart={() => {
          setSplashDone(false);
          setMode('auth');
          setAuthStep('splash');
          setStack([]);
          setSheet(null);
          setTab(1);
        }} />

    </UIContext.Provider>);

}