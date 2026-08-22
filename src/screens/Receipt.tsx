import React from 'react';
import { CheckIcon, DownloadIcon, Share2Icon, XCircleIcon, XIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { t } from '../strings';
import { formatSum, mediumDate, haptic } from '../tokens';
import type { Payment } from '../mockData';
import type { ReceiptChild } from './MonthDetail';
import { useUI } from '../ui';

interface ReceiptProps {
  payment: Payment;
  child: ReceiptChild;
  monthLabel: string;
  onClose: () => void;
}

export function Receipt({ payment, child, monthLabel, onClose }: ReceiptProps) {
  const { toast } = useUI();
  const voided = payment.voided;

  return (
    <div className="sheet-up absolute inset-0 z-[65] bg-background">
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute left-3 top-[50px] z-10 flex h-[44px] w-[44px] items-center justify-center rounded-full text-foreground transition-transform duration-100 ease-out active:scale-[0.97]">
        
        <XIcon size={24} />
      </button>

      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-10 pt-[110px]">
        <div className="overflow-hidden rounded-card border border-cardborder bg-card">
          <div className="flex flex-col items-center px-6 pt-8">
            <span
              className="flex h-[64px] w-[64px] items-center justify-center rounded-full"
              style={{ backgroundColor: voided ? 'hsl(var(--muted))' : 'hsl(var(--good))' }}>
              
              {voided ?
              <XCircleIcon size={34} className="text-mutedfg" /> :

              <CheckIcon size={34} className="text-white" strokeWidth={3} />
              }
            </span>
            <p
              className={[
              'mt-4 font-display text-money font-bold tabular-nums',
              voided ? 'text-mutedfg line-through' : 'text-foreground'].
              join(' ')}>
              
              {formatSum(payment.amount)}
            </p>
            <p className="mt-1 font-sans text-subhead tabular-nums text-mutedfg">
              {mediumDate(payment.date)}, {payment.time}
            </p>
          </div>

          {voided &&
          <div className="mx-6 mt-5 rounded-input bg-muted px-4 py-3">
              <p className="text-center font-sans text-subhead font-medium text-mutedfg">
                {t.receiptVoidedBanner}
              </p>
            </div>
          }

          <div className="mx-6 my-6 border-t border-dashed border-hairline" />

          <dl className="space-y-3 px-6">
            <Row label={t.receiptTo} value={`${child.firstName} ${child.lastName}`} />
            <Row label={t.receiptId} value={String(child.studentNo).padStart(5, '0')} mono />
            <Row label={t.receiptMonth} value={monthLabel} />
            <div className="flex items-start justify-between gap-4">
              <dt className="font-sans text-subhead text-mutedfg">{t.receiptMethod}</dt>
              <dd className="text-right">
                {payment.splits.map((split) =>
                <p
                  key={split.method}
                  className="font-sans text-subhead font-semibold tabular-nums text-foreground">
                  
                    {split.method}
                    {payment.splits.length > 1 &&
                  <span className="ml-3">{formatSum(split.amount)}</span>
                  }
                  </p>
                )}
              </dd>
            </div>
            <Row label={t.receiptTakenBy} value={payment.takenBy} />
            <Row label={t.receiptNo} value={String(payment.id)} mono />
          </dl>

          <div className="mt-6 px-6 pb-6">
            {!voided &&
            <div className="flex gap-2">
                <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  haptic('success');
                  toast(t.shared);
                }}>
                
                  <Share2Icon size={18} />
                  {t.receiptShare}
                </Button>
                <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  haptic('success');
                  toast(t.shared);
                }}>
                
                  <DownloadIcon size={18} />
                  {t.receiptPdf}
                </Button>
              </div>
            }
          </div>

          <div className="receipt-notch" />
        </div>
      </div>
    </div>);

}

function Row({ label, value, mono }: {label: string;value: string;mono?: boolean;}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-sans text-subhead text-mutedfg">{label}</dt>
      <dd
        className={[
        'text-right font-semibold text-foreground',
        mono ? 'font-mono text-subhead tabular-nums' : 'font-sans text-subhead'].
        join(' ')}>
        
        {value}
      </dd>
    </div>);

}