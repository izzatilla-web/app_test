import React from 'react';
import { ScanFaceIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../strings';
import { haptic } from '../tokens';

interface BiometricSetupProps {
  onEnable: () => void;
  onPin: () => void;
  onSkip: () => void;
}

export function BiometricSetup({ onEnable, onPin, onSkip }: BiometricSetupProps) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-background px-6 pb-10 pt-[120px]">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-primary/[0.12]">
          <ScanFaceIcon size={48} className="text-primary" strokeWidth={1.6} />
        </span>
        <h1 className="mt-6 font-display text-title2 font-semibold text-foreground">
          {t.bioTitle}
        </h1>
        <p className="mt-2 font-sans text-callout text-mutedfg">{t.bioBody}</p>
      </div>

      <div className="space-y-2">
        <Button
          full
          onClick={() => {
            haptic('success');
            onEnable();
          }}>
          
          {t.bioFace}
        </Button>
        <Button variant="plain" full onClick={onPin}>
          {t.bioPin}
        </Button>
        <Button variant="plain" full onClick={onSkip}>
          <span className="text-mutedfg">{t.bioSkip}</span>
        </Button>
      </div>
    </div>);

}