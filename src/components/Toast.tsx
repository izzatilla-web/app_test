import React from 'react';
import { CheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import type { ToastTone } from '../ui';

interface ToastProps {
  message: string;
  tone?: ToastTone;
  leaving?: boolean;
}

const TONE_META: Record<
  ToastTone,
  {icon: typeof CheckIcon;fg: string;bg: string;}> =
{
  success: { icon: CheckIcon, fg: 'hsl(var(--good))', bg: 'hsl(var(--good) / 0.14)' },
  warning: { icon: TriangleAlertIcon, fg: 'hsl(var(--warn))', bg: 'hsl(var(--warn) / 0.14)' },
  info: { icon: InfoIcon, fg: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.12)' }
};

/** Apple-style floating capsule alert: blurred, springs in from the top, slips away on exit. */
export function Toast({ message, tone = 'info', leaving = false }: ToastProps) {
  const meta = TONE_META[tone];
  const Icon = meta.icon;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[90] flex justify-center px-6" style={{ paddingTop: 'max(54px, env(safe-area-inset-top))' }}>
      <div
        className={[
        'flex max-w-[360px] items-center gap-[10px] rounded-[20px] border border-cardborder bg-card/90 py-[10px] pl-[10px] pr-4 backdrop-blur-xl',
        leaving ? 'alert-out' : 'alert-in'].
        join(' ')}
        style={{ boxShadow: '0 10px 34px rgb(0 0 0 / 0.16), 0 2px 8px rgb(0 0 0 / 0.08)' }}
        role="status">

        <span
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: meta.bg }}>

          <Icon size={14} strokeWidth={2.8} style={{ color: meta.fg }} />
        </span>
        <span className="min-w-0 text-left font-sans text-subhead font-semibold leading-snug text-foreground">
          {message}
        </span>
      </div>
    </div>);

}
