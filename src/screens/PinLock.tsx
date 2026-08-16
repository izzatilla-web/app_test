import React, { useState } from 'react';
import { DeleteIcon, ScanFaceIcon } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { t } from '../strings';
import { haptic } from '../tokens';

interface PinLockProps {
  name: string;
  seed: number;
  onUnlock: () => void;
  /** Correct PIN for the prototype. */
  pin?: string;
}

export function PinLock({ name, seed, onUnlock, pin = '1234' }: PinLockProps) {
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(false);

  function press(digit: string) {
    if (entry.length >= 4) return;
    haptic('light');
    const next = entry + digit;
    setEntry(next);
    if (next.length === 4) {
      window.setTimeout(() => {
        if (next === pin) {
          haptic('success');
          onUnlock();
        } else {
          haptic('warning');
          setWrong(true);
          window.setTimeout(() => {
            setWrong(false);
            setEntry('');
          }, 420);
        }
      }, 140);
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="flex h-full w-full flex-col items-center bg-background px-6 pb-10 pt-[80px]">
      <Avatar name={name} seed={seed} size={64} />
      <h1 className="mt-3 font-display text-title3 font-semibold text-foreground">{name}</h1>
      <p className="mt-1 font-sans text-subhead text-mutedfg">
        {wrong ? t.pinWrong : t.pinTitle}
      </p>

      <div className={['mt-8 flex gap-4', wrong ? 'shake' : ''].join(' ')}>
        {[0, 1, 2, 3].map((i) =>
        <span
          key={i}
          className="h-[14px] w-[14px] rounded-full transition-colors duration-150 ease-out"
          style={{
            backgroundColor:
            i < entry.length ?
            wrong ?
            'hsl(var(--destructive))' :
            'hsl(var(--foreground))' :
            'hsl(var(--muted))'
          }} />

        )}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-x-6 gap-y-4">
        {keys.map((key) =>
        <KeypadKey key={key} onClick={() => press(key)}>
            <span className="font-display text-title2 font-medium text-foreground">{key}</span>
          </KeypadKey>
        )}
        <KeypadKey onClick={() => haptic('light')} plain aria-label={t.pinFaceId}>
          <ScanFaceIcon size={26} className="text-primary" />
        </KeypadKey>
        <KeypadKey onClick={() => press('0')}>
          <span className="font-display text-title2 font-medium text-foreground">0</span>
        </KeypadKey>
        <KeypadKey
          onClick={() => setEntry((e) => e.slice(0, -1))}
          plain
          aria-label={t.pinDelete}>
          
          <DeleteIcon size={24} className="text-mutedfg" />
        </KeypadKey>
      </div>
    </div>);

}

function KeypadKey({
  onClick,
  children,
  plain,
  ...rest





}: {onClick: () => void;children: React.ReactNode;plain?: boolean;'aria-label'?: string;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={[
      'flex h-[72px] w-[72px] items-center justify-center rounded-full transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80',
      plain ? 'bg-transparent' : 'bg-secondary'].
      join(' ')}>
      
      {children}
    </button>);

}