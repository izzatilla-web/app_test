import React from 'react';
import { Sheet } from './Sheet';
import { useUI } from '../ui';
import { student } from '../mockData';
import { curriculumFor } from '../curriculum';
import { levelProgress } from '../access';
import { useLevelIdentity } from '../useLevelIdentity';
import { LevelSigil } from './LevelSignatureMark';
import {
  LEVEL_BANDS,
  levelAccent,
  levelGlow,
  type AcademicLevelCode,
  type LevelBandLetter
} from '../types/levelIdentity';

const ALL_BANDS: LevelBandLetter[] = ['A', 'B', 'C', 'D', 'E'];

export function LevelMapSheet() {
  const ui = useUI();
  const { meta, percent } = useLevelIdentity();
  const accent = levelAccent(meta, ui.dark);
  const curriculumLevels = curriculumFor(student.id);

  function isCompleted(code: AcademicLevelCode): boolean {
    const level = curriculumLevels.find((entry) => entry.code === code);
    return level ? levelProgress(level).percent === 100 : false;
  }

  return (
    <Sheet title="Mening darajam" detent="large" onClose={ui.closeSheet}>
      <div className="px-5 pb-6 pt-1">
        {/* ── Identity ── */}
        <div className="flex flex-col items-center pb-7 pt-3 text-center">
          <div
            aria-hidden="true"
            className="select-none font-display text-[56px] font-black leading-none tracking-tighter"
            style={{
              backgroundImage: `linear-gradient(180deg, ${accent}, ${levelGlow(meta, 0.4)})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            {meta.code}
          </div>

          <p className="mt-1.5 font-sans text-[13px] font-semibold text-mutedfg">
            {meta.title}
          </p>

          {percent !== null && (
            <div className="mt-4 flex w-[190px] items-center gap-2.5">
              <span
                className="relative h-[3px] flex-1 overflow-hidden rounded-full"
                style={{ backgroundColor: levelGlow(meta, ui.dark ? 0.24 : 0.13) }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: accent,
                    boxShadow: `0 0 6px ${levelGlow(meta, 0.5)}`,
                    transition: 'width 700ms cubic-bezier(0.32,0.72,0,1)'
                  }}
                />
              </span>
              <span
                className="font-sans text-[11px] font-bold tabular-nums"
                style={{ color: accent }}
              >
                {percent}%
              </span>
            </div>
          )}
        </div>

        {/* ── All Level Bands List (A → E) ── */}
        <div>
          {ALL_BANDS.map((letter, index) => (
            <BandRow
              key={letter}
              letter={letter}
              divider={index < ALL_BANDS.length - 1}
              currentCode={meta.code}
              dark={ui.dark}
              isCompleted={isCompleted}
            />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function BandRow({
  letter,
  divider,
  currentCode,
  dark,
  isCompleted
}: {
  letter: LevelBandLetter;
  divider: boolean;
  currentCode: AcademicLevelCode;
  dark: boolean;
  isCompleted: (code: AcademicLevelCode) => boolean;
}) {
  const band = LEVEL_BANDS[letter];
  const bandAccent = dark ? band.accentDark : band.accent;

  return (
    <div
      className={[
        'flex items-center gap-3 py-3.5',
        divider ? 'border-b border-hairline' : ''
      ].join(' ')}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `hsl(${band.glow} / ${dark ? 0.16 : 0.09})`,
          color: bandAccent
        }}
      >
        <LevelSigil band={letter} size={13} />
      </span>

      <span className="min-w-0 flex-1 truncate font-sans text-[14px] font-semibold text-foreground">
        {band.shortTitle}
      </span>

      <div className="flex shrink-0 items-center gap-[7px]">
        {band.subLevels.map((code) =>
          code === currentCode ? (
            <span
              key={code}
              className="flex h-[22px] items-center rounded-full px-2 font-sans text-[11px] font-bold tabular-nums text-white"
              style={{
                backgroundColor: bandAccent,
                boxShadow: `0 2px 8px hsl(${band.glow} / 0.4)`
              }}
            >
              {code}
            </span>
          ) : (
            <span
              key={code}
              className="h-[7px] w-[7px] rounded-full"
              style={{
                backgroundColor: isCompleted(code)
                  ? bandAccent
                  : `hsl(${band.glow} / ${dark ? 0.28 : 0.16})`
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
