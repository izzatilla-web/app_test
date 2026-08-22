import React, { useState } from 'react';
import { Settings2Icon, XIcon } from 'lucide-react';
import { t } from '../strings';
import type { DataState, Role } from '../ui';
import { GAMES_ENABLED } from '../config';
import { LEVEL_SEQUENCE, type AcademicLevelCode } from '../types/levelIdentity';

interface DevPanelProps {
  dark: boolean;
  setDark: (v: boolean) => void;
  role: Role;
  setRole: (r: Role) => void;
  dataState: DataState;
  setDataState: (s: DataState) => void;
  gameLocked: boolean;
  setGameLocked: (v: boolean) => void;
  /** Prototype-only: the level normally comes from the CRM, never the student. */
  studentLevel: AcademicLevelCode;
  setStudentLevel: (l: AcademicLevelCode) => void;
  onRestart: () => void;
}

/** Prototype-only developer tool. Deliberately styled as a dev overlay, not as app UI. */
export function DevPanel({
  dark,
  setDark,
  role,
  setRole,
  dataState,
  setDataState,
  gameLocked,
  setGameLocked,
  studentLevel,
  setStudentLevel,
  onRestart
}: DevPanelProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.devTitle}
        className="fixed right-3 top-3 z-[100] flex h-[34px] w-[34px] items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 text-neutral-400 shadow-lg backdrop-blur-sm transition-transform duration-100 ease-out active:scale-95">

        <Settings2Icon size={15} />
      </button>);

  }

  return (
    <aside className="fixed right-3 top-3 z-[100] max-h-[calc(100%-24px)] w-[212px] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900/95 p-3 font-mono text-[11px] text-neutral-300 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[1px] text-neutral-500">{t.devTitle}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="flex h-[22px] w-[22px] items-center justify-center rounded text-neutral-500 hover:bg-neutral-800">

          <XIcon size={13} />
        </button>
      </div>

      <Segment
        label={t.devTheme}
        options={[
        { value: 'light', label: t.devLight },
        { value: 'dark', label: t.devDark }]
        }
        value={dark ? 'dark' : 'light'}
        onChange={(v) => setDark(v === 'dark')} />
      

      <Segment
        label={t.devRole}
        options={[
        { value: 'student', label: t.devStudent },
        { value: 'parent', label: t.devParent }]
        }
        value={role}
        onChange={(v) => setRole(v as Role)} />


      {/* Games feature temporarily disabled — the game payment lock has no
          effect while GAMES_ENABLED is false, so the control is hidden. */}
      {GAMES_ENABLED &&
      <Segment
        label={t.devGame}
        options={[
        { value: 'paid', label: t.devPaid },
        { value: 'unpaid', label: t.devUnpaid }]
        }
        value={gameLocked ? 'unpaid' : 'paid'}
        onChange={(v) => setGameLocked(v === 'unpaid')} />

      }

      <div className="mt-3">
        <p className="mb-1 text-neutral-500">{t.devState}</p>
        <div className="grid grid-cols-2 gap-1">
          {(
          [
          ['full', t.devFull],
          ['loading', t.devLoading],
          ['empty', t.devEmpty],
          ['error', t.devError],
          ['offline', t.devOffline]] as
          [DataState, string][]).
          map(([value, label]) =>
          <button
            key={value}
            type="button"
            onClick={() => setDataState(value)}
            className={[
            'rounded px-2 py-[5px] text-left',
            dataState === value ?
            'bg-neutral-100 text-neutral-900' :
            'bg-neutral-800 hover:bg-neutral-700'].
            join(' ')}>
            
              {label}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-neutral-500">level (CRM)</p>
        <div className="grid grid-cols-5 gap-1">
          {LEVEL_SEQUENCE.map((level) => (
            <button
              key={level.code}
              type="button"
              onClick={() => setStudentLevel(level.code)}
              className={[
                'rounded px-1 py-[4px] text-center',
                studentLevel === level.code
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              ].join(' ')}
            >
              {level.code}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-3 w-full rounded bg-neutral-800 px-2 py-[6px] hover:bg-neutral-700">
        
        {t.devRestart}
      </button>
    </aside>);

}

function Segment({
  label,
  options,
  value,
  onChange





}: {label: string;options: {value: string;label: string;}[];value: string;onChange: (v: string) => void;}) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-neutral-500">{label}</p>
      <div className="flex gap-1">
        {options.map((option) =>
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
          'flex-1 rounded px-2 py-[5px]',
          value === option.value ?
          'bg-neutral-100 text-neutral-900' :
          'bg-neutral-800 hover:bg-neutral-700'].
          join(' ')}>
          
            {option.label}
          </button>
        )}
      </div>
    </div>);

}