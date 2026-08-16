import React from 'react';
import { ChevronLeftIcon } from 'lucide-react';

interface NavBarProps {
  title?: string;
  showTitle?: boolean;
  scrolled?: boolean;
  backTitle?: string;
  onBack?: () => void;
  /** Left slot used when there is no back button — e.g. the profile chip. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function NavBar({ title, showTitle, scrolled, backTitle, onBack, leading, trailing }: NavBarProps) {
  return (
    <div
      className={[
      'absolute inset-x-0 top-0 z-30 h-[88px] transition-[background-color,border-color] duration-200 ease-out',
      scrolled ?
      'border-b border-hairline bg-background/72 backdrop-blur-xl' :
      'border-b border-transparent bg-transparent'].
      join(' ')}>
      
      <div className="relative flex h-[44px] items-center justify-between px-2 pt-[44px]">
        <div className="flex min-w-[44px] items-center">
          {onBack ?
          <button
            type="button"
            onClick={onBack}
            className="flex h-[44px] min-w-[44px] items-center gap-[2px] rounded-lg pl-1 pr-2 text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">

              <ChevronLeftIcon size={24} strokeWidth={2.4} />
              <span className="max-w-[110px] truncate font-sans text-[17px]">{backTitle}</span>
            </button> :

          leading
          }
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[44px] flex h-[44px] items-center justify-center px-[70px]">
          <span
            className={[
            'truncate font-sans text-[17px] font-semibold text-foreground transition-[opacity,transform] duration-200 ease-out',
            showTitle ? 'translate-y-0 opacity-100' : 'translate-y-[6px] opacity-0'].
            join(' ')}>
            
            {title}
          </span>
        </div>

        <div className="flex min-w-[44px] items-center justify-end gap-1">{trailing}</div>
      </div>
    </div>);

}

interface NavIconButtonProps {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  badge?: boolean;
}

export function NavIconButton({ onClick, label, children, badge }: NavIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex h-[44px] w-[44px] items-center justify-center text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">
      
      {children}
      {badge &&
      <span className="absolute right-[9px] top-[9px] h-[9px] w-[9px] rounded-full border-2 border-background bg-bad" />
      }
    </button>);

}

export function NavPlainButton({ onClick, children }: {onClick: () => void;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[44px] items-center px-2 font-sans text-[15px] font-medium text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">
      
      {children}
    </button>);

}