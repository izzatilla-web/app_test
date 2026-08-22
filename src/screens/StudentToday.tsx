import React, { useEffect, useRef, useState } from 'react';
import {
  BellIcon,
  MessageCircleIcon,
  TrophyIcon } from
'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { NavIconButton } from '../components/NavBar';
import { ProfileChip } from '../components/ProfileChip';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { NextBookingWidget } from '../components/NextBookingWidget';
import { GoalProgressDashboardCard } from '../components/GoalProgressDashboardCard';
import { LevelAuraLayer } from '../components/LevelAuraLayer';
import { LevelDistanceTrack } from '../components/LevelDistanceTrack';
import { useLevelIdentity } from '../useLevelIdentity';
import { levelAccent, levelGlow, type LevelMeta } from '../types/levelIdentity';
import { Notifications } from './Notifications';
import { Ranking } from './Ranking';
import { ChatList } from './ChatList';
import { t } from '../strings';
import { student } from '../mockData';
import { firstNameOf } from '../types/phoenixUser';
import { useChatUnread } from '../useChatUnread';
import { useUI } from '../ui';

/**
 * Level Monogram — the oversized typographic mark of the current level.
 * A watermark, not a heading, and it carries the band's character:
 *
 *   A — hangs slightly askew from a single "nail", swaying like a sign
 *       fixed at one corner only: the journey has just begun;
 *   C — a spark orbits the mark like a satellite around a target;
 *   E — a gold halo breathes behind it.
 */
function LevelMonogram({ meta, dark }: { meta: LevelMeta; dark: boolean }) {
  const accent = levelAccent(meta, dark);
  const hanging = meta.band === 'A';

  return (
    <div aria-hidden="true" className="level-mark-in relative select-none pr-1">
      <div
        className={[
          'pointer-events-none absolute -top-6 right-0 h-20 w-28 rounded-full blur-2xl',
          meta.band === 'E' ? 'halo-breathe' : ''
        ].join(' ')}
        style={
          {
            '--halo-a': dark ? 0.6 : 0.5,
            background: levelGlow(meta, dark ? 0.24 : 0.14)
          } as React.CSSProperties
        }
      />

      {/* C — orbiting focus spark + a target ring that locks on */}
      {meta.band === 'C' && (
        <>
          <div className="level-orbit pointer-events-none absolute -inset-2">
            <span
              className="absolute left-1/2 top-0 h-[4px] w-[4px] -translate-x-1/2 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 6px ${levelGlow(meta, 0.8)}` }}
            />
          </div>
          <span
            className="level-lock pointer-events-none absolute left-1/2 top-1/2 h-[78px] w-[78px] rounded-full border"
            style={{
              borderColor: levelGlow(meta, 0.65),
              boxShadow: `0 0 14px ${levelGlow(meta, 0.25)}, inset 0 0 10px ${levelGlow(meta, 0.15)}`
            }}
          />
        </>
      )}

      <div
        className={meta.band === 'B' ? 'level-bob relative' : 'relative'}
      >
        {/* A — a little ":(" that playfully peeks out from behind the sign,
            holds a beat, then ducks back down. */}
        {hanging && (
          <div className="pointer-events-none absolute -top-[20px] left-[3px] h-[20px] w-[30px] overflow-hidden">
            <svg
              viewBox="0 0 16 16"
              width={16}
              height={16}
              className="level-peek absolute bottom-0 left-[6px] text-slate-400 dark:text-slate-500"
              fill="none"
            >
              <circle cx="8" cy="8" r="6.4" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="5.7" cy="6.9" r="0.95" fill="currentColor" />
              <circle cx="10.3" cy="6.9" r="0.95" fill="currentColor" />
              <path d="M5.3 11.4 Q8 9.3 10.7 11.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        )}

        <div
          className="relative font-display text-[46px] font-black leading-none tracking-tighter sm:text-[54px]"
          style={{
            backgroundImage: `linear-gradient(180deg, ${levelGlow(meta, dark ? 0.9 : 0.8)}, ${levelGlow(meta, dark ? 0.28 : 0.2)})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {meta.code}
        </div>

        <div className="relative mt-1.5 flex justify-end gap-1 pr-0.5">
          {[1, 2, 3].map((dot) => (
            <span
              key={dot}
              className="h-[4px] w-[4px] rounded-full transition-colors duration-300"
              style={{
                backgroundColor: dot <= meta.stage ? accent : levelGlow(meta, 0.22)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentToday({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const chatUnread = useChatUnread();
  const empty = dataState === 'empty';

  const { meta } = useLevelIdentity();

  /* Promotion moment: when the level rises, the aura fires a one-shot
     light sweep + bloom behind the header (see LevelAuraLayer). */
  const prevSequence = useRef(meta.sequence);
  const [celebrate, setCelebrate] = useState(0);
  useEffect(() => {
    if (meta.sequence > prevSequence.current) setCelebrate((count) => count + 1);
    prevSequence.current = meta.sequence;
  }, [meta.sequence]);

  return (
    <ScrollScreen
      title={t.tabToday}
      subtitle={t.todayGreeting(firstNameOf(ui.user))}
      backdrop={<LevelAuraLayer meta={meta} dark={ui.dark} celebrate={celebrate} />}
      titleAccessory={<LevelMonogram key={meta.code} meta={meta} dark={ui.dark} />}
      belowTitle={
        dataState === 'full' ?
        <div className="px-4 pb-2 pt-1.5">
            <LevelDistanceTrack />
          </div> :
        undefined
      }
      scrollKey="student-today"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      leading={
      <ProfileChip
        name={firstNameOf(ui.user)}
        seed={student.id}
        caption={ui.activeChild?.student.levelCode ?? student.level}
        label={t.profileOpenLabel}
        onClick={() => ui.goToTab(6)} />

      }
      trailing={
        <>
          {/* Arxiv: Leaderboard / Ranking (keyinchalik yoqish uchun)
          <NavIconButton
            label={t.rankingTitle}
            onClick={() =>
              ui.push({
                key: 'ranking',
                backTitle: t.tabToday,
                node: <Ranking child={student} backTitle={t.tabToday} />
              })
            }
          >
            <TrophyIcon size={21} />
          </NavIconButton>
          */}

          <NavIconButton
            label={t.notificationsTitle}
            badge={ui.unreadCount > 0}
            onClick={() =>
              ui.push({
                key: 'notifications',
                backTitle: t.tabToday,
                node: <Notifications backTitle={t.tabToday} />
              })
            }
          >
            <BellIcon size={21} />
          </NavIconButton>

          {/* Arxiv: Chat (keyinchalik yoqish uchun)
          <NavIconButton
            label={t.chatTitle}
            badge={chatUnread > 0}
            onClick={() =>
              ui.push({
                key: 'chat',
                backTitle: t.tabToday,
                node: <ChatList backTitle={t.tabToday} />
              })
            }
          >
            <MessageCircleIcon size={21} />
          </NavIconButton>
          */}
        </>
      }>

      {dataState === 'loading' ? (
        <ScreenSkeleton />
      ) : dataState === 'error' ? (
        <ErrorState onRetry={() => undefined} />
      ) : (
        <div className="space-y-4">
          {/* ── Prominent iPhone / iOS Apple-Style Next Booking Calendar Widget ── */}
          {!empty && (
            <section className="px-4">
              <NextBookingWidget />
            </section>
          )}

          {/* ── Prominent Academic Goal & Lesson Count Progress Widget ── */}
          {!empty && (
            <section className="px-4">
              <GoalProgressDashboardCard />
            </section>
          )}
        </div>
      )}
    </ScrollScreen>
  );
}
