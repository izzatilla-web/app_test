import React from 'react';
import {
  CalculatorIcon,
  CheckIcon,
  CrownIcon,
  DumbbellIcon,
  HashIcon,
  LockIcon,
  PercentIcon,
  PieChartIcon,
  PlayIcon,
  ScaleIcon,
  StarIcon,
  ZapIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { t } from '../strings';
import { gameState, units } from '../gameData';
import type { GameLevel, GameUnit, LevelKind } from '../gameData';
import { useUI } from '../ui';

const GOLD = 'hsl(42 96% 50%)';

export const UNIT_ICONS: Record<GameUnit['icon'], LucideIcon> = {
  hash: HashIcon,
  pie: PieChartIcon,
  calculator: CalculatorIcon,
  percent: PercentIcon,
  scale: ScaleIcon
};

const KIND_ICONS: Record<LevelKind, LucideIcon> = {
  practice: DumbbellIcon,
  speed: ZapIcon,
  boss: CrownIcon
};

function StarRow({ stars }: {stars: number;}) {
  return (
    <span className="mt-[3px] flex items-end gap-[3px]">
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        return (
          <StarIcon
            key={i}
            size={i === 1 ? 15 : 11}
            className={i === 1 ? 'mb-[1px]' : ''}
            style={{
              color: earned ? GOLD : 'hsl(var(--muted))',
              fill: earned ? GOLD : 'hsl(var(--muted))'
            }} />);


      })}
    </span>);

}

interface CurriculumUnitsProps {
  locked: boolean;
  onOpen: (level: GameLevel) => void;
}

export function CurriculumUnits({ locked, onOpen }: CurriculumUnitsProps) {
  const ui = useUI();
  return (
    <PushScreen title={t.unitsScreenTitle} backTitle={t.tabGame} onBack={ui.pop}>
      <div className="space-y-4 px-4 pt-2 pb-6">
        {units.map((unit) => {
          const done = unit.levels.filter((l) => l.id < gameState.currentId).length;
          const unitLockedAll = locked || unit.levels[0].id > gameState.currentId;
          const UnitIcon = UNIT_ICONS[unit.icon];
          return (
            <div key={unit.id} className="rounded-card border border-cardborder bg-card p-3">
              <div className="flex items-center gap-3 p-1">
                <span
                  className={[
                  'flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px]',
                  unitLockedAll ? 'bg-muted' : 'bg-primary/[0.1]'].
                  join(' ')}>

                  <UnitIcon
                    size={22}
                    className={unitLockedAll ? 'text-mutedfg' : 'text-primary'} />

                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-sans text-headline font-bold text-foreground">
                    {unit.title}
                  </h3>
                  <p className="mt-[1px] font-sans text-footnote tabular-nums text-mutedfg">
                    {t.unitLessonsOf(done, unit.levels.length)}
                  </p>
                </div>
                <span
                  className={[
                  'shrink-0 rounded-full px-3 py-[5px] font-sans text-caption font-bold',
                  unitLockedAll ? 'bg-muted text-mutedfg' : 'bg-primary/[0.1] text-primary'].
                  join(' ')}>

                  {unit.difficulty}
                </span>
              </div>

              <div className="mx-1 mt-1 h-[5px] overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${done / unit.levels.length * 100}%` }} />

              </div>

              <div className="mt-3 space-y-2">
                {unit.levels.map((level) => {
                  const isDone = level.id < gameState.currentId;
                  const isCurrent = level.id === gameState.currentId && !locked;
                  const stars = gameState.stars[level.id] ?? 0;
                  const KindIcon = KIND_ICONS[level.kind];
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => onOpen(level)}
                      className={[
                      'flex min-h-[54px] w-full items-center gap-3 rounded-[14px] border px-3 py-2 text-left transition-[transform,opacity] duration-100 ease-out active:scale-[0.985]',
                      isCurrent ?
                      'border-primary/50 bg-primary/[0.08]' :
                      'border-cardborder bg-secondary/60'].
                      join(' ')}>

                      <KindIcon
                        size={16}
                        className={[
                        'shrink-0',
                        isCurrent ? 'text-primary' : isDone ? 'text-mutedfg' : 'text-mutedfg/60'].
                        join(' ')} />

                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                          'block truncate font-sans text-subhead font-semibold',
                          isDone || isCurrent ? 'text-foreground' : 'text-mutedfg'].
                          join(' ')}>

                          {level.title}
                        </span>
                        {isDone && <StarRow stars={stars} />}
                      </span>
                      {isDone ?
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-good">
                          <CheckIcon size={16} strokeWidth={3} className="text-white" />
                        </span> :
                      isCurrent ?
                      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary">
                          <PlayIcon size={15} className="ml-[2px] text-primaryfg" fill="currentColor" />
                        </span> :

                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-muted">
                          <LockIcon size={14} className="text-mutedfg" />
                        </span>
                      }
                    </button>);

                })}
              </div>
            </div>);

        })}
      </div>
    </PushScreen>);

}
