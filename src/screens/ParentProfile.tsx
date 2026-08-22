import React, { useEffect, useRef, useState } from 'react';
import { CameraIcon, GlobeIcon, LockIcon, MoonIcon, ScanFaceIcon, SmartphoneIcon, LogOutIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { Avatar } from '../components/Avatar';
import { ListGroup, ListRow } from '../components/List';
import { Switch } from '../components/Switch';
import { PhoneSheet } from '../components/PhoneSheet';
import { LanguageSheet } from '../components/LanguageSheet';
import { Devices } from './Devices';
import { enrollBiometrics, forgetBiometrics, isBiometricEnrolled, isBiometricSupported } from '../services/biometrics';
import { t, localeLabel } from '../strings';
import { parent } from '../mockData';
import { fullNameOf } from '../types/phoenixUser';
import { photoUrl, updateMyPhone, uploadMyPhoto } from '../services/portalApi';
import { ApiError } from '../services/http';
import { phoneErrorMessage } from '../services/portalAdapters';
import { useUI } from '../ui';
import { haptic } from '../tokens';

const PARENT_AVATAR_SEED = 9;

export function ParentProfile({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const NOTIFICATION_PREFS = [
    t.notifPrefAbsent,
    t.notifPrefHw,
    t.notifPrefDue,
    t.notifPrefPaid,
    t.notifPrefExam
  ];

  /* A parent's own number lives on their guardian record — the one Phoenix-MS
     links to this login. Falls back to the mock value until the portal loads. */
  const myChildren = ui.portalChildren ?? [];
  const myGuardian = ui.activeChild?.guardians.find((g) => g.userId === ui.user?.id);
  const phone = myGuardian?.phone ?? parent.phone;

  /** Writes the new number to Phoenix-MS, then re-reads what the CRM stored. */
  async function savePhone(next: string): Promise<string | null> {
    try {
      await updateMyPhone(next);
    } catch (err) {
      if (err instanceof ApiError) return phoneErrorMessage(err.status, err.message);
      return t.authErrGeneric;
    }
    ui.reloadPortal();
    return null;
  }

  /* The picture lives in Phoenix-MS. `hasPhoto` on the session says whether
     there is one; the stamp busts the CRM's one-minute cache after an upload. */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoStamp, setPhotoStamp] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const currentPhoto = ui.user && ui.user.hasPhoto ? photoUrl(ui.user.id, photoStamp) : null;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || photoBusy) return;
    // Phoenix-MS accepts up to 15 MB and does its own resizing.
    if (file.size > 15 * 1024 * 1024) {
      ui.toast(t.photoTooLarge, 'warning');
      return;
    }
    setPhotoBusy(true);
    try {
      await uploadMyPhoto(file);
      ui.refreshUser();
      setPhotoStamp(Date.now());
      haptic('success');
      ui.toast(t.photoUpdated, 'success');
    } catch (err) {
      haptic('warning');
      ui.toast(err instanceof ApiError ? err.message : t.photoFailed, 'warning');
    } finally {
      setPhotoBusy(false);
    }
  }

  const [prefs, setPrefs] = useState<boolean[]>(() => [true, true, true, true, true]);

  /* Quick unlock: the phone's own face or fingerprint check, kept for this
     account on this device. It reveals a session Phoenix-MS already granted —
     the server lock below is the stronger, password-backed one. */
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isBiometricSupported().
    then((supported) => {
      if (cancelled) return;
      setBioSupported(supported);
      setBioOn(!!ui.user && isBiometricEnrolled(ui.user.id));
    }).
    catch(() => {
      if (!cancelled) setBioSupported(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ui.user]);

  async function toggleBiometrics(next: boolean) {
    if (!ui.user || bioBusy) return;
    setBioBusy(true);
    try {
      if (!next) {
        forgetBiometrics(ui.user.id);
        setBioOn(false);
        ui.refreshBiometrics();
        ui.toast(t.bioDisabled, 'info');
        return;
      }
      const ok = await enrollBiometrics(ui.user.id, ui.user.username);
      setBioOn(ok);
      ui.refreshBiometrics();
      ui.toast(ok ? t.bioEnabled : t.bioEnrollFailed, ok ? 'success' : 'warning');
    } catch {
      setBioOn(false);
      ui.toast(t.bioEnrollFailed, 'warning');
    } finally {
      setBioBusy(false);
    }
  }

  return (
    <ScrollScreen
      title={t.tabProfile}
      scrollKey="parent-profile"
      scrollToTopSignal={scrollSignal}
      offline={ui.dataState === 'offline'}
    >
      <div className="space-y-5 px-4 pb-24">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            <button
              type="button"
              onClick={() => {
                haptic('light');
                fileInputRef.current?.click();
              }}
              aria-label={t.photoChange}
              className="group relative transition-transform duration-150 ease-out active:scale-95"
            >
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-blue-500/30 dark:bg-slate-800">
                {currentPhoto ? (
                  <img src={currentPhoto} alt={fullNameOf(ui.user)} className="h-full w-full object-cover" />
                ) : (
                  <Avatar name={fullNameOf(ui.user)} seed={PARENT_AVATAR_SEED} size={96} />
                )}
              </div>

              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm dark:border-slate-900">
                <CameraIcon size={11} strokeWidth={2.5} />
              </span>
            </button>

            <h2 className="mt-3 font-sans text-lg font-bold text-foreground">
              {fullNameOf(ui.user)}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-mutedfg">
              {ui.user?.username ?? parent.username}
            </p>
          </div>
        </div>

        {/* Contact info */}
        <ListGroup header={t.contactHeader}>
          <ListRow
            last
            label={<span className="font-normal">{t.phoneLabel}</span>}
            value={phone}
            chevron
            onClick={() =>
              ui.openSheet({
                key: 'phone',
                detent: 'medium',
                node: <PhoneSheet value={phone ?? ''} onSave={savePhone} />
              })
            }
          />
        </ListGroup>

        {/* Children List — every child Phoenix-MS links to this login. */}
        <ListGroup header={t.childrenHeader}>
          {myChildren.map((bundle, i) => {
            const kid = bundle.student;
            return (
              <ListRow
                key={kid.id}
                last={i === myChildren.length - 1}
                label={
                  <span className="flex items-center gap-3">
                    <Avatar name={kid.firstName} seed={kid.id} size={32} />
                    <span className="font-semibold text-foreground">
                      {kid.firstName} {kid.lastName}
                    </span>
                  </span>
                }
                trailing={
                  <span className="font-mono text-xs text-mutedfg">
                    {String(kid.studentNo).padStart(5, '0')}
                  </span>
                }
                below={
                  <span className="ml-[44px] mt-0.5 block font-sans text-xs text-mutedfg">
                    {[kid.levelCode, kid.groupName].filter(Boolean).join(' · ')}
                  </span>
                }
              />
            );
          })}
        </ListGroup>

        {/* Notification preferences */}
        <ListGroup header={t.notifPrefsHeader} footer={t.notifPrefNote}>
          {NOTIFICATION_PREFS.map((label, i) => (
            <ListRow
              key={label}
              last={i === NOTIFICATION_PREFS.length - 1}
              label={<span className="font-normal">{label}</span>}
              trailing={
                <Switch
                  checked={prefs[i]}
                  label={label}
                  onChange={(v) =>
                    setPrefs((prev) => prev.map((p, index) => (index === i ? v : p)))
                  }
                />
              }
            />
          ))}
        </ListGroup>

        {/* Settings */}
        <ListGroup header={t.settingsHeader}>
          <ListRow
            icon={GlobeIcon}
            label={<span className="font-normal">{t.languageRow}</span>}
            value={localeLabel(ui.language)}
            chevron
            onClick={() =>
              ui.openSheet({
                key: 'language',
                detent: 'medium',
                node: (
                  <LanguageSheet
                    value={ui.language}
                    onChange={ui.setLanguage}
                    onClose={ui.closeSheet}
                  />
                )
              })
            }
          />

          <ListRow
            icon={MoonIcon}
            label={<span className="font-normal">{t.darkModeRow}</span>}
            trailing={<Switch checked={ui.dark} onChange={ui.setDark} label={t.darkModeRow} />}
          />

          <ListRow
            icon={ScanFaceIcon}
            label={<span className="font-normal">{t.bioRow}</span>}
            value={bioSupported ? undefined : t.bioUnavailable}
            trailing={
              bioSupported ? (
                <Switch checked={bioOn} onChange={toggleBiometrics} label={t.bioRow} />
              ) : undefined
            }
          />

          <ListRow
            icon={SmartphoneIcon}
            label={<span className="font-normal">{t.devicesRow}</span>}
            chevron
            onClick={() =>
              ui.push({
                key: 'devices',
                backTitle: t.tabProfile,
                node: <Devices backTitle={t.tabProfile} />
              })
            }
          />

          <ListRow
            last
            icon={LockIcon}
            label={<span className="font-normal">{t.lockNow}</span>}
            chevron
            onClick={ui.lockNow}
          />
        </ListGroup>

        {/* Logout */}
        <div className="pt-2">
          <button
            type="button"
            onClick={ui.logout}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 font-sans text-xs font-bold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98] dark:border-red-950 dark:bg-red-950/30 dark:text-red-400"
          >
            <LogOutIcon size={15} />
            {t.logout}
          </button>
          <p className="mt-3 text-center font-sans text-xs text-mutedfg">{t.version}</p>
        </div>
      </div>
    </ScrollScreen>
  );
}