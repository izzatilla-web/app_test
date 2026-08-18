import React from 'react';
import { useUI } from '../ui';
import { haptic } from '../tokens';
import { useLevelIdentity } from '../useLevelIdentity';
import { LevelMapSheet } from './LevelMapSheet';
import { LevelSigil } from './LevelSignatureMark';
import { levelAccent, levelGlow } from '../types/levelIdentity';

export function LevelDistanceTrack({ className = '' }: { className?: string }) {
  const ui = useUI();
  const { meta, next, percent } = useLevelIdentity();
  const accent = levelAccent(meta, ui.dark);
  const fill = percent ?? 0;

  function handleOpen() {
    haptic('light');
    ui.openSheet({
      key: 'level-map-sheet',
      detent: 'large',
      node: <LevelMapSheet />
    });
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label={`Daraja: ${meta.code}`}
      className="group block w-full select-none text-left transition-opacity active:opacity-80"
    >
      <div className={['flex items-center gap-2.5', className].join(' ')}>
        <span
          className="font-sans text-[13px] font-extrabold tracking-tight tabular-nums transition-colors duration-300"
          style={{ color: accent }}
        >
          {meta.code}
        </span>

        <span
          className="relative h-[3px] flex-1 overflow-visible rounded-full"
          style={{ backgroundColor: levelGlow(meta, ui.dark ? 0.22 : 0.13) }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${fill}%`,
              background: `linear-gradient(90deg, ${levelGlow(meta, 0.55)}, ${accent})`,
              boxShadow: `0 0 8px ${levelGlow(meta, 0.5)}`,
              transition: 'width 900ms cubic-bezier(0.32,0.72,0,1)'
            }}
          />
          <span
            className="level-beacon absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full"
            style={
              {
                left: `calc(${fill}% - 3.5px)`,
                backgroundColor: accent,
                '--beacon': levelGlow(meta, 0.4),
                transition: 'left 900ms cubic-bezier(0.32,0.72,0,1)'
              } as React.CSSProperties
            }
          />
        </span>

        {next ? (
          <span className="font-sans text-[13px] font-bold tracking-tight tabular-nums text-mutedfg/70">
            {next.code}
          </span>
        ) : (
          <LevelSigil band={meta.band} size={13} style={{ color: accent }} />
        )}

        {percent !== null && (
          <span
            className="font-sans text-[11px] font-bold tabular-nums transition-colors duration-300"
            style={{ color: accent }}
          >
            {percent}%
          </span>
        )}
      </div>
    </button>
  );
}
