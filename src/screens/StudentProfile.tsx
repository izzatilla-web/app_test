import { useState } from 'react';
import {
  BellIcon,
  GlobeIcon,
  LockIcon,
  MoonIcon,
  PencilIcon,
  Volume2Icon,
  WandSparklesIcon,
  FlameIcon,
  BookOpenIcon,
  AwardIcon,
  LogOutIcon
} from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { Avatar } from '../components/Avatar';
import { ListGroup, ListRow } from '../components/List';
import { Switch } from '../components/Switch';
import { PhoneSheet } from '../components/PhoneSheet';
import { LanguageSheet } from '../components/LanguageSheet';
import { Notifications } from './Notifications';
import { AvatarStudio } from './AvatarStudio';
import { useAvatarConfig, useAvatarVersion } from '../avatar/avatarStore';
import { isSoundMuted, setSoundMuted } from '../sound';
import { t, localeLabel } from '../strings';
import { student } from '../mockData';
import { useUI } from '../ui';
import { haptic } from '../tokens';

export function StudentProfile({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const [phone, setPhone] = useState(student.phone);
  const [pinOn, setPinOn] = useState(true);
  const [soundOn, setSoundOn] = useState(() => !isSoundMuted());
  const hasAvatar = useAvatarConfig(student.id) !== null;
  const avatarVersion = useAvatarVersion();

  return (
    <ScrollScreen
      title={t.tabProfile}
      scrollKey="student-profile"
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
                ui.openFullScreen(<AvatarStudio seed={student.id} />);
              }}
              aria-label={t.avatarEditLabel}
              className="group relative transition-transform duration-150 ease-out active:scale-95"
            >
              <div className="relative rounded-full ring-2 ring-blue-500/30">
                <span key={avatarVersion} className="rise-in block">
                  <Avatar name={student.firstName} seed={student.id} size={96} />
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
              {student.firstName} {student.lastName}
            </h2>

            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-sans text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {student.level}
              </span>
              <span className="font-mono text-xs text-mutedfg">
                {student.studentNo}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-3">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 font-sans text-xs font-bold text-orange-500">
                <FlameIcon size={12} className="fill-current" />
                14 kun
              </span>
              <span className="mt-0.5 font-sans text-[11px] text-mutedfg">Streak</span>
            </div>

            <div className="flex flex-col items-center border-x border-hairline">
              <span className="flex items-center gap-1 font-sans text-xs font-bold text-blue-600 dark:text-blue-400">
                <BookOpenIcon size={12} />
                16 mavzu
              </span>
              <span className="mt-0.5 font-sans text-[11px] text-mutedfg">O'rganildi</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 font-sans text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <AwardIcon size={12} />
                88%
              </span>
              <span className="mt-0.5 font-sans text-[11px] text-mutedfg">Imtihonlar</span>
            </div>
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

        {/* Settings */}
        <ListGroup header={t.settingsHeader}>
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
            last
            icon={LockIcon}
            label={<span className="font-normal">{t.pinRow}</span>}
            trailing={<Switch checked={pinOn} onChange={setPinOn} label={t.pinRow} />}
          />
        </ListGroup>

        {/* School details */}
        <ListGroup header={t.schoolHeader} footer={t.schoolNote}>
          <ListRow label={<span className="font-normal">{t.levelLabel}</span>} value={student.level} />
          <ListRow label={<span className="font-normal">{t.groupLabel}</span>} value={student.group} />
          <ListRow label={<span className="font-normal">{t.statusLabel}</span>} value={student.status} />
          <ListRow label={<span className="font-normal">{t.teacherLabel}</span>} value={student.teacher} />
          <ListRow
            last
            label={<span className="font-normal">{t.loginLabel}</span>}
            value={<span className="font-mono">{student.studentNo}</span>}
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