import React from 'react';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { Sheet } from './Sheet';
import { haptic } from '../tokens';
import type { CurriculumTopic, TopicKonspekt } from '../curriculum';
import { useUI } from '../ui';

interface KonspektViewerSheetProps {
  topic: CurriculumTopic;
  konspekt?: TopicKonspekt;
}

interface FormulaRow {
  name: string;
  formula: string;
}

export function KonspektViewerSheet({ topic, konspekt: propKonspekt }: KonspektViewerSheetProps) {
  const { closeSheet, toast } = useUI();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  // Structured formula items
  const formulas: FormulaRow[] = [
    { name: 'Foiz ta’rifi', formula: '1% = 1/100 = 0.01' },
    { name: 'Sonning foizini topish', formula: 'b = (a · p) / 100' },
    { name: 'Foiziga ko‘ra sonni topish', formula: 'a = (b · 100) / p' },
    { name: 'Ikki sonning foiz nisbati', formula: 'p = (a / b) · 100%' }
  ];

  const keyPoints: string[] = [
    'Har doim butun miqdor 100% deb qabul qilinadi.',
    'Oddiy kasrni foizga aylantirish uchun uni 100 ga ko‘paytirish kerak.',
    'O‘nli kasrni foizga aylantirish uchun vergul 2 xona o‘ngga siljitiladi.',
    'Hisoblashda qulaylik uchun 25% = 1/4, 50% = 1/2, 75% = 3/4 nisbatlardan foydalaning.'
  ];

  function handleCopy(text: string, index: number) {
    haptic('light');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast('Formula nusxalandi', 'info');
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  }

  return (
    <Sheet
      title={topic.title}
      subtitle={
        <div className="font-sans text-xs pt-0.5 text-mutedfg">
          Qoidalar va konspekt
        </div>
      }
      detent="large"
      onClose={closeSheet}
    >
      <div className="space-y-5 px-4 pb-10 pt-1">
        {/* ── 1. Clean Apple Notes Summary ── */}
        <div className="px-1">
          <p className="font-sans text-sm leading-relaxed text-mutedfg">
            {topic.title} mavzusi bo‘yicha barcha asosiy matematik formulalar, nazariy qoidalar va hisoblash usullari.
          </p>
        </div>

        {/* ── 2. Inset Grouped Formulas ── */}
        <div className="space-y-2">
          <h3 className="px-1 font-sans text-xs font-semibold uppercase tracking-wider text-mutedfg">
            Asosiy formulalar
          </h3>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800/80">
            {formulas.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleCopy(item.formula, idx)}
                className="group flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-sans text-xs font-medium text-mutedfg">
                    {item.name}
                  </div>
                  <div className="mt-0.5 font-sans text-sm sm:text-base font-semibold text-foreground tracking-tight">
                    {item.formula}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Nusxalash"
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-60 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-foreground dark:text-slate-500 dark:hover:bg-slate-800"
                >
                  {copiedIndex === idx ? (
                    <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CopyIcon size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Inset Grouped Key Points ── */}
        <div className="space-y-2">
          <h3 className="px-1 font-sans text-xs font-semibold uppercase tracking-wider text-mutedfg">
            Muhim qoidalar
          </h3>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800/80">
            {keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="font-sans text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
