import React, { useEffect, useRef, useState } from 'react';
import {
  BellIcon,
  GlobeIcon,
  LockIcon,
  ScanFaceIcon,
  SmartphoneIcon,
  MoonIcon,
  CameraIcon,
  Volume2Icon,
  LogOutIcon
} from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { Avatar } from '../components/Avatar';
import { ListGroup, ListRow } from '../components/List';
import { Switch } from '../components/Switch';
import { PhoneSheet } from '../components/PhoneSheet';
import { LanguageSheet } from '../components/LanguageSheet';
import { Notifications } from './Notifications';
import { Devices } from './Devices';
import { enrollBiometrics, forgetBiometrics, isBiometricEnrolled, isBiometricSupported } from '../services/biometrics';
import { isSoundMuted, setSoundMuted } from '../sound';
import { t, localeLabel } from '../strings';
import { student } from '../mockData';
import { firstNameOf, fullNameOf } from '../types/phoenixUser';
import { photoUrl, updateMyPhone, uploadMyPhoto } from '../services/portalApi';
import { ApiError } from '../services/http';
import { phoneErrorMessage } from '../services/portalAdapters';
import { useUI } from '../ui';
import { haptic } from '../tokens';
import { useLevelIdentity } from '../useLevelIdentity';
import { levelGlow } from '../types/levelIdentity';

export function StudentProfile({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { meta } = useLevelIdentity();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* The school's record, from Phoenix-MS — the mock value only stands in until it loads. */
  const phone = ui.activeChild?.student.phone ?? student.phone;

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
  const [soundOn, setSoundOn] = useState(() => !isSoundMuted());

  /* The picture lives in Phoenix-MS, not on this phone. `hasPhoto` on the
     session says whether there is one; the stamp busts the CRM's one-minute
     cache so a freshly uploaded picture appears at once. */
  const [photoStamp, setPhotoStamp] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const currentPhoto =
  ui.user && ui.user.hasPhoto ? photoUrl(ui.user.id, photoStamp) : null;

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
      scrollKey="student-profile"
      scrollToTopSignal={scrollSignal}
      offline={ui.dataState === 'offline'}
    >
      <div className="space-y-3.5 px-4 pb-3 pt-0">
        {/* Profile Card — Clean & Minimalist */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center">
            {/* Hidden Photo File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Direct Image Upload Avatar Button */}
            <button
              type="button"
              onClick={() => {
                haptic('light');
                fileInputRef.current?.click();
              }}
              aria-label="Profil rasmini o'zgartirish"
              className="group relative transition-transform duration-150 ease-out active:scale-95"
            >
              <div
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-sm transition-shadow duration-500 dark:bg-slate-800"
                style={{
                  boxShadow: `0 0 0 2px ${levelGlow(meta, ui.dark ? 0.4 : 0.28)}, 0 0 14px ${levelGlow(meta, ui.dark ? 0.3 : 0.18)}`
                }}
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={firstNameOf(ui.user)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Avatar name={firstNameOf(ui.user)} seed={student.id} size={96} />
                )}
              </div>

              {/* Camera Upload Badge */}
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-90 dark:border-slate-900">
                <CameraIcon size={11} strokeWidth={2.5} />
              </span>
            </button>

            {/* Student Name */}
            <h2 className="mt-2.5 font-sans text-base font-bold text-foreground">
              {fullNameOf(ui.user)}
            </h2>

            {/* Student Login ID */}
            <div className="mt-1 flex items-center gap-1.5 font-sans text-xs text-mutedfg">
              <span>ID:</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {ui.user?.username ?? student.studentNo}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info (without double horizontal padding) */}
        <ListGroup header={t.contactHeader} className="px-0">
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

        {/* Settings (without double horizontal padding) */}
        <ListGroup header={t.settingsHeader} className="px-0">
          <ListRow
            icon={BellIcon}
            label={<span className="font-normal">{t.notificationsRow}</span>}
            chevron
            onClick={() =>
              ui.push({
                key: 'notifications',
                backTitle: t.tabProfile,
                node: <Notifications backTitle={t.tabProfile} />
              })
            }
          />

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
            icon={Volume2Icon}
            label={<span className="font-normal">{t.soundRow}</span>}
            trailing={
              <Switch
                checked={soundOn}
                onChange={(value) => {
                  setSoundOn(value);
                  setSoundMuted(!value);
                }}
                label={t.soundRow}
              />
            }
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

        {/* Logout Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={ui.logout}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 font-sans text-xs font-bold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98] dark:border-red-950 dark:bg-red-950/30 dark:text-red-400"
          >
            <LogOutIcon size={14} />
            {t.logout}
          </button>
          <p className="mt-2 text-center font-sans text-[11px] text-mutedfg">{t.version}</p>
        </div>
      </div>
    </ScrollScreen>
  );
}