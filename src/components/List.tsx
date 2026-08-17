import React from "react";
import { ChevronRightIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ListGroupProps {
  header?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
}

export function ListGroup({
  header,
  footer,
  children,
  className
}: ListGroupProps) {
  const hasCustomPadding = className && (className.includes('px-') || className.includes('p-'));
  return (
    <section className={[hasCustomPadding ? '' : 'px-4', className ?? ''].join(' ')}>
      {header && (
        <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
          {header}
        </h2>
      )}
      <div className="overflow-hidden rounded-card border border-cardborder bg-card">{children}</div>
      {footer && <p className="mt-2 px-1 font-sans text-footnote text-mutedfg">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  icon?: LucideIcon;
  iconTone?: string;
  label: React.ReactNode;
  secondary?: React.ReactNode;
  value?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  /** Last row in a group — no separator. */
  last?: boolean;
  below?: React.ReactNode;
  dimmed?: boolean;
}
export function ListRow({
  icon: Icon,
  iconTone,
  label,
  secondary,
  value,
  trailing,
  chevron,
  onClick,
  last,
  below,
  dimmed
}: ListRowProps) {
  const interactive = Boolean(onClick);
  const className = ['flex w-full items-center gap-3 pl-4 text-left', interactive ? 'transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-80' : '', dimmed ? 'opacity-60' : ''].join(' ');
  const inner = <>
      {Icon && <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center">
          <Icon size={20} className={iconTone ?? 'text-primary'} />
        </span>}
      <span className={['flex min-h-[44px] flex-1 items-center gap-3 py-[10px] pr-4', last ? '' : 'border-b border-hairline'].join(' ')}>
        <span className="min-w-0 flex-1">
          <span className="block font-sans text-headline font-semibold text-foreground">
            {label}
          </span>
          {secondary && <span className="mt-[1px] block font-sans text-subhead text-mutedfg">{secondary}</span>}
          {below}
        </span>
        {value !== undefined && <span className="shrink-0 font-sans text-headline tabular-nums text-mutedfg">{value}</span>}
        {trailing}
        {chevron && <ChevronRightIcon size={18} className="shrink-0 text-mutedfg/70" />}
      </span>
    </>;
  if (interactive) {
    return <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>;
  }
  return <div className={className}>{inner}</div>;
}