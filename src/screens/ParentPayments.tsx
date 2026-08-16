import React from 'react';
import { CheckCircle2Icon, FileTextIcon, WalletIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Card } from '../components/Card';
import { ListGroup, ListRow } from '../components/List';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { MonthDetail } from './MonthDetail';
import { t } from '../strings';
import { formatSum } from '../tokens';
import { childBalance, childById, children, familyBalance } from '../mockData';
import type { LedgerMonth } from '../mockData';
import { useUI } from '../ui';

export function ParentPayments({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const child = childById(ui.activeChildId);
  const ledger: LedgerMonth[] = dataState === 'empty' ? [] : child.ledger;
  const balance = childBalance(child);

  return (
    <ScrollScreen
      title={t.tabPayments}
      scrollKey="parent-payments"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
      <ChildSwitcher children={children} activeId={ui.activeChildId} onSelect={ui.setActiveChildId} />
      }>
      
      {dataState === 'loading' ?
      <ScreenSkeleton /> :
      dataState === 'error' ?
      <ErrorState onRetry={() => undefined} /> :

      <div className="space-y-8">
          <section className="px-4">
            <Card padded={false}>
              <div className="flex flex-col items-center px-4 py-6">
                {balance > 0 ?
              <>
                    <p className="font-sans text-caption font-medium uppercase tracking-[0.4px] text-mutedfg">
                      {t.balanceCaption}
                    </p>
                    <p className="mt-2 font-display text-money font-bold tabular-nums text-destructive">
                      {formatSum(balance)} {t.currency}
                    </p>
                  </> :

              <>
                    <CheckCircle2Icon size={40} className="text-good" strokeWidth={1.8} />
                    <p className="mt-2 font-display text-title2 font-semibold text-foreground">
                      {t.allPaid}
                    </p>
                  </>
              }
              </div>
              {children.length > 1 &&
            <div className="border-t border-hairline px-4 py-3">
                  <p className="text-center font-sans text-footnote tabular-nums text-mutedfg">
                    {t.debtAllChildren(formatSum(familyBalance))}
                  </p>
                </div>
            }
            </Card>
          </section>

          {ledger.length === 0 ?
        <EmptyState icon={WalletIcon} title={t.emptyChargesTitle} /> :

        <ListGroup header={t.monthsHeader} footer={t.paymentsFooter}>
              {ledger.map((month, i) =>
          <ListRow
            key={month.month}
            last={i === ledger.length - 1}
            chevron
            onClick={() =>
            ui.push({
              key: `month-${month.month}`,
              backTitle: t.tabPayments,
              node: <MonthDetail month={month} child={child} />
            })
            }
            label={
            <span className="flex items-center gap-[6px]">
                      {month.label}
                      {month.cheque && <FileTextIcon size={13} className="text-mutedfg" />}
                    </span>
            }
            secondary={
            <span className="tabular-nums">
                      {formatSum(month.paid)} / {formatSum(month.due)}
                    </span>
            }
            trailing={
            month.writtenOff ?
            <StatusPill tone="grey" label={t.writtenOff} /> :
            month.balance > 0 ?
            <StatusPill tone="red" label={t.debtPill(formatSum(month.balance))} /> :

            <StatusPill tone="green" label={t.paid} />

            } />

          )}
            </ListGroup>
        }
        </div>
      }
    </ScrollScreen>);

}