import React, { useState } from 'react';
import { CheckIcon, LockIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../strings';
import { haptic } from '../tokens';

export function NewPassword({ onDone }: {onDone: () => void;}) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');

  const rules = [
  { label: t.pwRule8, ok: first.length >= 8 },
  { label: t.pwRuleDigit, ok: /\d/.test(first) },
  { label: t.pwRuleMatch, ok: first.length > 0 && first === second }];

  const allOk = rules.every((r) => r.ok);

  return (
    <div className="h-full w-full overflow-y-auto bg-background px-6 pb-10 pt-[92px]">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-primary/[0.12]">
          <LockIcon size={40} className="text-primary" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 font-display text-title2 font-semibold text-foreground">{t.pwTitle}</h1>
        <p className="mt-2 font-sans text-callout text-mutedfg">{t.pwBody}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-card border border-cardborder bg-card">
        <input
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          type="password"
          placeholder={t.pwNew}
          className="h-[50px] w-full border-b border-hairline bg-transparent px-4 font-sans text-body text-foreground outline-none placeholder:text-mutedfg/60" />
        
        <input
          value={second}
          onChange={(e) => setSecond(e.target.value)}
          type="password"
          placeholder={t.pwRepeat}
          className="h-[50px] w-full bg-transparent px-4 font-sans text-body text-foreground outline-none placeholder:text-mutedfg/60" />
        
      </div>

      <ul className="mt-4 space-y-2 px-1">
        {rules.map((rule) =>
        <li key={rule.label} className="flex items-center gap-2">
            <span
            className={[
            'flex h-[20px] w-[20px] items-center justify-center rounded-full transition-colors duration-200 ease-out',
            rule.ok ? 'bg-good' : 'border border-muted bg-transparent'].
            join(' ')}>
            
              {rule.ok && <CheckIcon size={13} className="text-white" strokeWidth={3} />}
            </span>
            <span
            className={[
            'font-sans text-footnote',
            rule.ok ? 'text-foreground' : 'text-mutedfg'].
            join(' ')}>
            
              {rule.label}
            </span>
          </li>
        )}
      </ul>

      <div className="mt-8">
        <Button
          full
          disabled={!allOk}
          onClick={() => {
            haptic('success');
            onDone();
          }}>
          
          {t.pwSave}
        </Button>
      </div>
    </div>);

}