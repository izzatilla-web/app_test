import React from "react";
import { BoxIcon } from "lucide-react";
interface EmptyStateProps {
  icon: BoxIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  compact?: boolean;
}
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact
}: EmptyStateProps) {
  return <div className={['flex flex-col items-center px-8 text-center', compact ? 'py-6' : 'py-14'].join(' ')}>
      <Icon size={48} strokeWidth={1.5} className="text-mutedfg opacity-40" />
      <h3 className="mt-4 font-sans text-headline font-semibold text-foreground">{title}</h3>
      {body && <p className="mt-1 font-sans text-subhead text-mutedfg">{body}</p>}
      {action && <div className="mt-5 w-full max-w-[240px]">{action}</div>}
    </div>;
}