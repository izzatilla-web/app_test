import { useState } from 'react';
import { GlobeIcon, LockIcon, MoonIcon, PencilIcon, WandSparklesIcon, LogOutIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { Avatar } from '../components/Avatar';
import { ListGroup, ListRow } from '../components/List';
import { Switch } from '../components/Switch';
import { PhoneSheet } from '../components/PhoneSheet';
import { LanguageSheet } from '../components/LanguageSheet';
import { AvatarStudio } from './AvatarStudio';
import { useAvatarConfig, useAvatarVersion } from '../avatar/avatarStore';
import { t, localeLabel } from '../strings';
import { children, parent } from '../mockData';
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

  const [phone, setPhone] = useState(parent.phone);
  const [pinOn, setPinOn] = useState(true);
  const [prefs, setPrefs] = useState<boolean[]>(() => [true, true, true, true, true]);
  const hasAvatar = useAvatarConfig(PARENT_AVATAR_SEED) !== null;
  const avatarVersion = useAvatarVersion();

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
            <button
              type="button"
              onClick={() => {
                haptic('light');
                ui.openFullScreen(<AvatarStudio seed={PARENT_AVATAR_SEED} />);
              }}
              aria-label={t.avatarEditLabel}
              className="group relative transition-transform duration-150 ease-out active:scale-95"
            >
              <div className="relative rounded-full ring-2 ring-blue-500/30">
                <span key={avatarVersion} className="rise-in block">
                  <Avatar name={parent.name} seed={PARENT_AVATAR_SEED} size={96} />
                </span>
              </div>

              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm dark:border-slate-900">
                {hasAvatar ? (
                  <PencilIcon size={11} strokeWidth={2.5} />
                ) : (
                  <WandSparklesIcon size={11} strokeWidth={2.5} />
                )}
              </span>
            </button>

            <h2 className="mt-3 font-sans text-lg font-bold text-foreground">
              {parent.name}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-mutedfg">
              {parent.username}
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
                node: <PhoneSheet value={phone} onSave={setPhone} />
              })
            }
          />
        </ListGroup>

        {/* Children List */}
        <ListGroup header={t.childrenHeader}>
          {children.map((child, i) => (
            <ListRow
              key={child.id}
              last={i === children.length - 1}
              label={
                <span className="flex items-center gap-3">
                  <Avatar name={child.firstName} seed={child.id} size={32} />
                  <span className="font-semibold text-foreground">
                    {child.firstName} {child.lastName}
                  </span>
                </span>
              }
              trailing={
                <span className="font-mono text-xs text-mutedfg">
                  {child.studentNo}
                </span>
              }
              below={
                <span className="ml-[44px] mt-0.5 block font-sans text-xs text-mutedfg">
                  {child.level} · {child.group}
                </span>
              }
            />
          ))}
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
            last
            icon={LockIcon}
            label={<span className="font-normal">{t.pinRow}</span>}
            trailing={<Switch checked={pinOn} onChange={setPinOn} label={t.pinRow} />}
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