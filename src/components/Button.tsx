import React from 'react';

type Variant = 'primary' | 'secondary' | 'plain' | 'destructive';

interface ButtonProps {
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

const BASE =
'inline-flex items-center justify-center gap-2 rounded-card font-sans font-semibold transition-[transform,opacity,background-color] duration-100 ease-out active:scale-[0.97] active:opacity-80 disabled:pointer-events-none disabled:opacity-40';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primaryfg text-[17px] h-[50px] px-5',
  secondary: 'bg-primary/[0.12] text-primary text-[17px] h-[50px] px-5',
  plain: 'text-primary text-[17px] h-[44px] px-3',
  destructive: 'bg-destructive/[0.12] text-destructive text-[17px] h-[50px] px-5'
};

export function Button({
  variant = 'primary',
  onClick,
  disabled,
  full,
  children,
  className,
  type = 'button'
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[BASE, VARIANTS[variant], full ? 'w-full' : '', className ?? ''].join(' ')}>
      
      {children}
    </button>);

}