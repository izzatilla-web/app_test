import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { haptic } from '../tokens';

export interface TabItem {
  id: number;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface TabBarProps {
  items: TabItem[];
  active: number;
  onSelect: (id: number) => void;
}

export function TabBar({
  items,
  active,
  onSelect
}: TabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 w-full select-none border-t border-slate-200/70 bg-white/80 pb-[max(10px,env(safe-area-inset-bottom,12px))] pt-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_-4px_24px_rgba(0,0,0,0.03)] backdrop-blur-2xl backdrop-saturate-[180%] transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_-4px_24px_rgba(0,0,0,0.3)]"
      aria-label="Asosiy navigatsiya"
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic('light');
                onSelect(item.id);
              }}
              aria-current={isActive ? 'page' : undefined}
              className="group relative flex min-h-[48px] flex-1 flex-col items-center justify-center py-1 outline-none transition-opacity duration-150 active:opacity-70"
            >
              <div className="relative flex flex-col items-center justify-center">
                {/* Soft ambient active glow */}
                <div
                  aria-hidden="true"
                  className={[
                    'pointer-events-none absolute -inset-2 -z-10 rounded-full transition-opacity duration-200 ease-out',
                    isActive
                      ? 'bg-primary/10 opacity-100 blur-[6px] dark:bg-primary/25'
                      : 'opacity-0'
                  ].join(' ')}
                />

                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.15 : 1.75}
                    className={[
                      'transition-colors duration-150 ease-out',
                      isActive
                        ? 'text-primary dark:text-blue-400'
                        : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                    ].join(' ')}
                  />

                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -right-2.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 font-sans text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={[
                    'mt-1 font-sans text-[10.5px] leading-tight tracking-tight transition-colors duration-150 ease-out',
                    isActive
                      ? 'font-semibold text-primary dark:text-blue-400'
                      : 'font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}