import React from "react";
import { BellOffIcon, ClockIcon, FileCheck2Icon, UserXIcon, WalletIcon, BoxIcon } from "lucide-react";
import { PushScreen } from "../components/ScrollScreen";
import { NavPlainButton } from "../components/NavBar";
import { EmptyState } from "../components/EmptyState";
import { t } from "../strings";
import { toneBg, toneFg, haptic, Tone } from "../tokens";
import { notifications as seed, NotificationItem } from "../mockData";
import { useUI } from "../ui";
const ICONS: Record<NotificationItem['icon'], BoxIcon> = {
  UserX: UserXIcon,
  Wallet: WalletIcon,
  FileCheck2: FileCheck2Icon,
  Clock: ClockIcon
};
export function Notifications({
  backTitle = t.back


}: {backTitle?: string;}) {
  const ui = useUI();
  const items: NotificationItem[] = ui.dataState === 'empty' ? [] : seed.map((n) => ({
    ...n,
    unread: ui.unreadCount === 0 ? false : n.unread
  }));
  const unread = items.filter((n) => n.unread);
  const read = items.filter((n) => !n.unread);
  return <PushScreen title={t.notificationsTitle} backTitle={backTitle} onBack={ui.pop} trailing={items.length > 0 ? <NavPlainButton onClick={() => {
    haptic('success');
    ui.markAllRead();
  }}>
            {t.markAllRead}
          </NavPlainButton> : undefined}>
      {items.length === 0 ? <EmptyState icon={BellOffIcon} title={t.emptyNotifTitle} body={t.emptyNotifBody} /> : <div className="space-y-8 pt-2">
          {unread.length > 0 && <Group header={t.notifNewHeader} items={unread} />}
          {read.length > 0 && <Group header={t.notifOldHeader} items={read} />}
        </div>}
    </PushScreen>;
}
function Group({
  header,
  items



}: {header: string;items: NotificationItem[];}) {
  return <section className="px-4">
      <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
        {header}
      </h2>
      <div className="overflow-hidden rounded-card border border-cardborder bg-card">
        {items.map((item, i) => {
        const Icon = ICONS[item.icon];
        return <div key={item.id} className="flex items-start gap-3 pl-4" style={{
          backgroundColor: item.unread ? 'hsl(var(--primary) / 0.04)' : undefined
        }}>
              <div className="flex items-center gap-2 pt-3">
                <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{
              backgroundColor: item.unread ? 'hsl(var(--primary))' : 'transparent'
            }} />
                <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full" style={{
              backgroundColor: toneBg(item.tone as Tone)
            }}>
                  <Icon size={18} style={{
                color: toneFg(item.tone as Tone)
              }} />
                </span>
              </div>
              <div className={['flex min-h-[44px] flex-1 items-start gap-3 py-3 pr-4', i === items.length - 1 ? '' : 'border-b border-hairline'].join(' ')}>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-headline font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-[2px] font-sans text-subhead text-mutedfg">{item.body}</p>
                </div>
                <span className="shrink-0 pt-[2px] font-sans text-caption text-mutedfg">
                  {item.time}
                </span>
              </div>
            </div>;
      })}
      </div>
    </section>;
}