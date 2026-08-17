import React, { useRef, useState } from 'react';
import { haptic } from '../tokens';

interface SheetProps {
  title?: string;
  subtitle?: React.ReactNode;
  detent?: 'medium' | 'large';
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const HEIGHTS = { medium: 430, large: 776 };

export function Sheet({ title, subtitle, detent = 'medium', onClose, children, footer }: SheetProps) {
  const [current, setCurrent] = useState<'medium' | 'large'>(detent);
  const [drag, setDrag] = useState(0);
  const [closing, setClosing] = useState(false);
  const start = useRef<number | null>(null);

  function close() {
    setClosing(true);
    window.setTimeout(onClose, 260);
  }

  function onPointerDown(e: React.PointerEvent) {
    start.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (start.current === null) return;
    const dy = e.clientY - start.current;
    setDrag(dy > 0 ? dy : dy * 0.25);
  }

  function onPointerUp() {
    if (start.current === null) return;
    const dy = drag;
    start.current = null;
    setDrag(0);
    if (current === 'large' && dy > 120) {
      setCurrent('medium');
      haptic('light');
    } else if (dy > 110) {
      close();
    } else if (dy < -60 && current === 'medium') {
      setCurrent('large');
      haptic('light');
    }
  }

  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="Yopish"
        onClick={close}
        className="absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out"
        style={{ opacity: closing ? 0 : 1 }}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          'absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-cardborder bg-card shadow-lg',
          closing ? '' : 'sheet-up'
        ].join(' ')}
        style={{
          height: HEIGHTS[current],
          transform: closing ? 'translateY(100%)' : `translateY(${Math.max(drag, 0)}px)`,
          transition:
            start.current === null
              ? 'height 300ms cubic-bezier(0.32,0.72,0,1), transform 300ms cubic-bezier(0.32,0.72,0,1)'
              : undefined
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="shrink-0 cursor-grab touch-none pt-2 active:cursor-grabbing"
        >
          <div className="mx-auto h-1 w-9 rounded-full bg-slate-300 dark:bg-slate-700" />
          {title && (
            <div className="px-4 pb-3 pt-3">
              <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
              {subtitle && (
                typeof subtitle === 'string' ? (
                  <p className="mt-0.5 font-sans text-xs text-mutedfg">{subtitle}</p>
                ) : (
                  <div className="mt-0.5">{subtitle}</div>
                )
              )}
            </div>
          )}
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain pb-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-hairline bg-card px-4 pb-8 pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
