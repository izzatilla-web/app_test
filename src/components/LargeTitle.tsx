import React from 'react';

interface LargeTitleProps {
  title: string;
  subtitle?: string;
  collapsed?: boolean;
  accessory?: React.ReactNode;
}

export function LargeTitle({ title, subtitle, collapsed, accessory }: LargeTitleProps) {
  return (
    <div
      className={[
      'flex items-start justify-between gap-4 px-4 pb-2 pt-1 transition-[opacity,transform] duration-200 ease-out',
      collapsed ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'].
      join(' ')}>
      
      <div className="min-w-0">
        <h1 className="font-display text-largetitle font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-[2px] font-sans text-subhead text-mutedfg">{subtitle}</p>}
      </div>
      {accessory}
    </div>);

}