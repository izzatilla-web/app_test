import React, { useEffect } from 'react';
import { FlameIcon } from 'lucide-react';
import { t } from '../strings';

export function Splash({ onDone }: {onDone: () => void;}) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background">
      <div className="rise-in flex flex-col items-center">
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px]"
          style={{
            background: 'linear-gradient(140deg, hsl(var(--primary)), hsl(var(--accent)))'
          }}>
          
          <FlameIcon size={36} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="mt-4 font-display text-title2 font-semibold text-foreground">{t.brand}</h1>
      </div>

      <div className="absolute bottom-[80px] flex gap-[6px]">
        {[0, 1, 2].map((i) =>
        <span
          key={i}
          className="h-[6px] w-[6px] animate-pulse rounded-full bg-mutedfg/50"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: '1000ms' }} />

        )}
      </div>
    </div>);

}