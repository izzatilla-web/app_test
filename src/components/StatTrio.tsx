import React from 'react';

export interface StatItem {
  value: string;
  label: string;
  hint?: string;
}

export function StatTrio({ items }: {items: StatItem[];}) {
  return (
    <div className="flex gap-2 px-4">
      {items.map((item) =>
      <div
        key={item.label}
        className="flex-1 rounded-card border border-cardborder bg-card px-3 py-3">
        
          <p className="font-display text-title3 font-semibold tabular-nums text-foreground">
            {item.value}
          </p>
          <p className="mt-[2px] font-sans text-caption font-medium uppercase tracking-[0.4px] text-mutedfg">
            {item.label}
          </p>
          {item.hint && <p className="mt-[2px] font-sans text-caption text-mutedfg/80">{item.hint}</p>}
        </div>
      )}
    </div>);

}