import React from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { t } from '../strings';

export function ErrorState({ onRetry }: {onRetry: () => void;}) {
  return (
    <EmptyState
      icon={AlertTriangleIcon}
      title={t.errorTitle}
      body={t.errorBody}
      action={
      <Button variant="secondary" full onClick={onRetry}>
          {t.errorRetry}
        </Button>
      } />);


}