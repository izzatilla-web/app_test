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
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
      aria-label="Asosiy navigatsiya"
    >
      <div className="mx-auto flex h-[60px] max-w-[420px] items-center justify-around rounded-2xl border border-slate-200/90 bg-white/95 px-2 shadow-lg backdrop-blur-xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/95">
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
              className="relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 ease-out active:scale-95"
            >
              <div
                className={[
                  'flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-colors duration-150',
                  isActive ? 'bg-blue-50 dark:bg-blue-950/60' : 'bg-transparent'
                ].join(' ')}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    className={
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  />
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 font-sans text-[9px] font-bold text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={[
                    'mt-0.5 font-sans text-[11px]',
                    isActive
                      ? 'font-bold text-blue-600 dark:text-blue-400'
                      : 'font-medium text-slate-500 dark:text-slate-400'
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