import React from 'react';
import { haptic } from '../tokens';

interface SegmentedControlProps {
  options: string[];
  value: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      className="relative flex h-[40px] rounded-[14px] bg-slate-100/90 p-[3px] dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50"
    >
      <div
        className="absolute bottom-[3px] top-[3px] rounded-[11px] bg-white shadow-sm dark:bg-slate-700 dark:shadow-none"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${value * 100}%)`,
          transition: 'transform 260ms cubic-bezier(0.23, 1, 0.32, 1)'
        }}
      />

      {options.map((option, i) => (
        <button
          key={option}
          role="tab"
          aria-selected={i === value}
          type="button"
          onClick={() => {
            haptic('light');
            onChange(i);
          }}
          className={[
            'relative z-10 flex-1 rounded-[11px] font-sans text-[13px] font-semibold transition-all duration-200 ease-out',
            i === value ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          ].join(' ')}
        >
          {option}
        </button>
      ))}
    </div>
  );
}