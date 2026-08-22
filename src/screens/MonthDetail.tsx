import React from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { Card } from '../components/Card';
import { ListGroup } from '../components/List';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';
import { Receipt } from './Receipt';
import { t } from '../strings';
import { formatSum, shortDate, haptic } from '../tokens';
import type { LedgerMonth } from '../mockData';
import { useUI } from '../ui';
import { ReceiptIcon } from 'lucide-react';

/**
 * Who the receipt is made out to. Only the three fields the receipt prints, so
 * a Phoenix-MS student and a mock record both satisfy it.
 */
export interface ReceiptChild {
  firstName: string;
  lastName: string;
  studentNo: number | string;
}

export function MonthDetail({ month, child }: {month: LedgerMonth;child: ReceiptChild;}) {
  const ui = useUI();

  return (
    <PushScreen title={month.label} backTitle={t.tabPayments} onBack={ui.pop}>
      <div className="space-y-8 pt-2">
        <section className="px-4">
          <Card padded={false}>
            <SummaryRow label={t.charged} value={formatSum(month.due)} />
            <SummaryRow label={t.paidRow} value={formatSum(month.paid)} />
            <div className="border-t border-hairline">
              <SummaryRow
                label={t.remainder}
                value={formatSum(month.balance)}
                emphasis={month.balance > 0}
                last />
              
            </div>
          </Card>
        </section>

        {month.payments.length === 0 ?
        <EmptyState icon={ReceiptIcon} title={t.emptyChargesTitle} compact /> :

        <ListGroup header={t.receiptsHeader} footer={t.paymentsFooter}>
            {month.payments.map((payment, i) => {
            const methods = payment.splits.map((s) => s.method).join(' · ');
            const last = i === month.payments.length - 1 && !month.cheque;
            return (
              <button
                key={payment.id}
                type="button"
                onClick={() => {
                  haptic('light');
                  ui.openFullScreen(
                    <Receipt
                      payment={payment}
                      child={child}
                      monthLabel={month.label}
                      onClose={ui.closeFullScreen} />

                  );
                }}
                className="flex w-full items-start gap-3 pl-4 text-left transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-80">
                
                  <span className="flex h-[44px] w-[24px] shrink-0 items-center">
                    {payment.voided ?
                  <XIcon size={18} className="text-mutedfg" /> :

                  <CheckIcon size={18} className="text-good" />
                  }
                  </span>
                  <span
                  className={[
                  'flex-1 py-3 pr-4',
                  last ? '' : 'border-b border-hairline'].
                  join(' ')}>
                  
                    <span
                    className={[
                    'block font-sans text-headline font-semibold tabular-nums',
                    payment.voided ? 'text-mutedfg' : 'text-foreground'].
                    join(' ')}>
                    
                      {shortDate(payment.date)}
                    </span>
                    <span
                    className={[
                    'mt-[2px] block font-sans text-subhead tabular-nums text-mutedfg',
                    payment.voided ? 'line-through' : ''].
                    join(' ')}>
                    
                      {formatSum(payment.amount)} {t.currency} · {methods}
                    </span>
                    {payment.voided &&
                  <span className="mt-2 block">
                        <StatusPill tone="grey" label={t.receiptVoided} />
                      </span>
                  }
                  </span>
                </button>);

          })}

            {month.cheque &&
          <div className="flex items-center gap-2 px-4 py-3">
                <CheckIcon size={16} className="text-good" />
                <span className="font-sans text-subhead text-good">{t.chequeGiven}</span>
              </div>
          }
          </ListGroup>
        }
      </div>
    </PushScreen>);

}

function SummaryRow({
  label,
  value,
  emphasis,
  last





}: {label: string;value: string;emphasis?: boolean;last?: boolean;}) {
  return (
    <div
      className={[
      'flex min-h-[44px] items-center justify-between px-4 py-2',
      last ? '' : 'border-b border-hairline'].
      join(' ')}>
      
      <span className="font-sans text-body text-mutedfg">{label}</span>
      <span
        className={[
        'font-sans text-body tabular-nums',
        emphasis ? 'font-bold text-destructive' : 'font-semibold text-foreground'].
        join(' ')}>
        
        {value} {t.currency}
      </span>
    </div>);

}