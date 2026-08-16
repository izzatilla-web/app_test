import React from 'react';
import { CheckIcon } from 'lucide-react';
import { Sheet } from './Sheet';
import { ListGroup, ListRow } from './List';
import { t, LOCALES } from '../strings';
import type { Locale } from '../strings';
import { haptic } from '../tokens';

interface LanguageSheetProps {
  value: Locale;
  onChange: (lang: Locale) => void;
  onClose: () => void;
}

export function LanguageSheet({ value, onChange, onClose }: LanguageSheetProps) {
  return (
    <Sheet title={t.langTitle} detent="medium" onClose={onClose}>
      <ListGroup>
        {LOCALES.map((option, i) =>
        <ListRow
          key={option.code}
          last={i === LOCALES.length - 1}
          label={<span className="font-normal">{option.label}</span>}
          onClick={() => {
            haptic('success');
            onChange(option.code);
            onClose();
          }}
          trailing={
          option.code === value ? <CheckIcon size={20} className="text-primary" /> : undefined
          } />

        )}
      </ListGroup>
    </Sheet>);

}
