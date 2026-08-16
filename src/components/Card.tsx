import React from "react";
import { toneBg, toneFg } from "../tokens";
import { BoxIcon } from "lucide-react";
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}
export function Card({
  children,
  className,
  padded = true
}: CardProps) {
  return <div className={['rounded-card border border-cardborder bg-card', padded ? 'p-4' : '', className ?? ''].join(' ')}>
      {children}
    </div>;
}
interface AlertCardProps {
  tone: 'amber' | 'red';
  icon: BoxIcon;
  title: string;
  body?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}
export function AlertCard({
  tone,
  icon: Icon,
  title,
  body,
  children,
  action
}: AlertCardProps) {
  return <div className="rounded-card p-4" style={{
    backgroundColor: toneBg(tone),
    border: `1px solid ${toneFg(tone)}`,
    borderColor: `hsl(var(${tone === 'amber' ? '--warn' : '--bad'}) / 0.35)`
  }}>
      <div className="flex items-start gap-2">
        <Icon size={18} className="mt-[2px] shrink-0" style={{
        color: toneFg(tone)
      }} />
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-headline font-semibold" style={{
          color: toneFg(tone)
        }}>
            {title}
          </h3>
          {body && <p className="mt-1 font-sans text-subhead text-foreground/80">{body}</p>}
          {children}
        </div>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>;
}