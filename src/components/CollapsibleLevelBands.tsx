import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import type { CurriculumLevel } from '../curriculum';
import { haptic } from '../tokens';
import { useUI } from '../ui';
import { LevelDetail } from '../screens/LevelDetail';
import type { ChildRecord } from '../mockData';

const BAND_META: Record<string, { title: string; subtitle: string }> = {
  A: { title: "Boshlang‘ich va o‘rta matematika", subtitle: "A1, A2, A3 darajalar" },
  B: { title: "Algebra va Geometriya", subtitle: "B1, B2, B3 darajalar" },
  C: { title: "DTM & SAT tayyorgarlik", subtitle: "C1, C2, C3 darajalar" },
  D: { title: "Milliy va xalqaro olimpiada", subtitle: "D1, D2, D3 darajalar" },
  E: { title: "Oliy matematika & Data Science", subtitle: "E1, E2, E3 darajalar" },
};

interface CollapsibleLevelBandsProps {
  levels: CurriculumLevel[];
  child: ChildRecord;
}

export function CollapsibleLevelBands({ levels, child }: CollapsibleLevelBandsProps) {
  const ui = useUI();

  // Find the current active band for the student (e.g. 'A' from 'A2')
  const currentBandLetter = useMemo(() => {
    const letter = child.level ? child.level.charAt(0).toUpperCase() : 'A';
    return letter;
  }, [child.level]);

  // Expanded state map — default the student's active band to true
  const [expandedBands, setExpandedBands] = useState<Record<string, boolean>>(() => ({
    [currentBandLetter]: true
  }));

  // Group levels by their starting letter (Band)
  const groupedBands = useMemo(() => {
    const map = new Map<string, CurriculumLevel[]>();
    for (const lvl of levels) {
      const letter = lvl.code.charAt(0).toUpperCase() || 'A';
      const list = map.get(letter) || [];
      list.push(lvl);
      map.set(letter, list);
    }

    return Array.from(map.entries()).map(([band, bandLevels]) => {
      let totalTopics = 0;
      let doneTopics = 0;

      for (const lvl of bandLevels) {
        const modTotal = lvl.modules.reduce((acc, m) => acc + m.topics.length, 0);
        const modDone = lvl.modules.reduce(
          (acc, m) => acc + m.topics.filter((t) => t.studied).length,
          0
        );
        totalTopics += modTotal;
        doneTopics += modDone;
      }

      const percent = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
      const isCompleted = percent === 100;
      const isCurrent = percent > 0 && percent < 100;

      return {
        band,
        bandLevels,
        totalTopics,
        doneTopics,
        percent,
        isCompleted,
        isCurrent,
        meta: BAND_META[band] || { title: `${band} darajalari`, subtitle: `${bandLevels.length} ta daraja` }
      };
    });
  }, [levels]);

  function toggleBand(band: string) {
    haptic('light');
    setExpandedBands((prev) => ({
      ...prev,
      [band]: !prev[band]
    }));
  }

  function openLevel(lvl: CurriculumLevel) {
    haptic('light');
    ui.push({
      key: `level-${lvl.id}`,
      backTitle: 'Ortga',
      node: <LevelDetail child={child} levelId={lvl.id} />
    });
  }

  return (
    <div className="space-y-2.5">
      {groupedBands.map((item) => {
        const isOpen = Boolean(expandedBands[item.band]);

        return (
          <div
            key={item.band}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 dark:border-slate-800/90 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            {/* Band Accordion Header Button */}
            <button
              type="button"
              onClick={() => toggleBand(item.band)}
              className="flex w-full flex-col px-4 pt-3.5 pb-4 text-left transition-colors active:bg-slate-50 dark:active:bg-slate-800/50"
            >
              {/* Top Row: Band Code + Title + Toggle Icon */}
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={[
                      'font-display text-base font-extrabold shrink-0',
                      item.isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    ].join(' ')}
                  >
                    Level {item.band}
                  </span>
                  <span className="truncate font-sans text-sm font-semibold text-foreground">
                    {item.meta.title}
                  </span>
                </div>

                <div className="shrink-0 ml-2 flex items-center gap-1.5">
                  <span
                    className={[
                      'font-sans text-xs font-bold tabular-nums',
                      item.isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    ].join(' ')}
                  >
                    {item.percent}%
                  </span>
                  <div
                    className={[
                      'flex h-6 w-6 items-center justify-center text-slate-400 transition-transform duration-200',
                      isOpen ? 'rotate-180 text-foreground' : ''
                    ].join(' ')}
                  >
                    <ChevronDownIcon size={18} />
                  </div>
                </div>
              </div>

              {/* Progress Summary & Track */}
              <div className="mt-3 w-full">
                <div className="mb-1.5 flex items-center justify-between font-sans text-xs font-medium tabular-nums text-mutedfg">
                  <span>
                    {item.doneTopics} / {item.totalTopics} mavzu
                  </span>
                  <span>{item.bandLevels.length} ta daraja</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={[
                      'bar-fill h-full rounded-full transition-all duration-500 ease-out',
                      item.isCompleted
                        ? 'bg-emerald-500'
                        : item.isCurrent
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    ].join(' ')}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            </button>

            {/* Expanded Sub-Levels List */}
            {isOpen && (
              <div className="border-t border-slate-100 px-3.5 pb-3.5 pt-2.5 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                {item.bandLevels.map((lvl) => {
                  const modTotal = lvl.modules.reduce((acc, m) => acc + m.topics.length, 0);
                  const modDone = lvl.modules.reduce(
                    (acc, m) => acc + m.topics.filter((t) => t.studied).length,
                    0
                  );
                  const percent = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0;
                  const isFinished = percent === 100;
                  const isCurrent = percent > 0 && percent < 100;

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => openLevel(lvl)}
                      className="group flex w-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-xs transition-all duration-150 hover:border-slate-300 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      {/* Sub-level Code + Title + Chevron */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={[
                              'font-display text-sm font-bold shrink-0',
                              isFinished
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isCurrent
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400'
                            ].join(' ')}
                          >
                            {lvl.code}
                          </span>
                          <span className="truncate font-sans text-xs sm:text-sm font-semibold text-foreground">
                            {lvl.title}
                          </span>
                        </div>

                        <div className="shrink-0 ml-2 flex items-center gap-1">
                          <span
                            className={[
                              'font-sans text-xs font-semibold tabular-nums',
                              isFinished
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : isCurrent
                                ? 'text-blue-600 dark:text-blue-400 font-bold'
                                : 'text-mutedfg'
                            ].join(' ')}
                          >
                            {percent}%
                          </span>
                          <ChevronRightIcon
                            size={16}
                            className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 dark:group-hover:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* Sub-level Progress Bar */}
                      <div className="mt-2.5 w-full">
                        <div className="mb-1 flex items-center justify-between font-sans text-[11px] font-medium tabular-nums text-mutedfg">
                          <span>{modDone} / {modTotal} mavzu</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={[
                              'h-full rounded-full transition-all duration-400 ease-out',
                              isFinished
                                ? 'bg-emerald-500'
                                : isCurrent
                                ? 'bg-blue-600 dark:bg-blue-500'
                                : 'bg-slate-300 dark:bg-slate-700'
                            ].join(' ')}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
