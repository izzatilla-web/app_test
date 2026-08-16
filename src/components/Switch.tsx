import React from 'react';
import { haptic } from '../tokens';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic('light');
        onChange(!checked);
      }}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ease-out"
      style={{ backgroundColor: checked ? 'hsl(var(--good))' : 'hsl(var(--muted))' }}>
      
      <span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-thumb"
        style={{
          left: 2,
          transform: `translateX(${checked ? 20 : 0}px)`,
          transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)'
        }} />
      
    </button>);

}