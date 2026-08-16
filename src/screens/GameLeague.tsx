import React from 'react';
import { ChevronDownIcon, ChevronUpIcon, MedalIcon, ShieldIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { Avatar } from '../components/Avatar';
import { t } from '../strings';
import { leagueRows } from '../gameData';
import { useUI } from '../ui';

function tiers() {
  return [
  { name: t.tierBronze, color: 'hsl(24 45% 48%)', state: 'done' },
  { name: t.tierSilver, color: 'hsl(215 14% 55%)', state: 'current' },
  { name: t.tierGold, color: 'hsl(42 80% 48%)', state: 'locked' },
  { name: t.tierDiamond, color: 'hsl(199 80% 55%)', state: 'locked' }];

}


const MEDAL_COLORS = ['hsl(42 80% 48%)', 'hsl(215 14% 55%)', 'hsl(24 45% 48%)'];

export function GameLeague() {
  const ui = useUI();

  return (
    <PushScreen title={t.leagueName} backTitle={t.tabGame} onBack={ui.pop}>
      <div className="space-y-6 pt-2">
        <section className="px-4">
          <div className="rounded-card border border-cardborder bg-card p-4">
            <div className="flex items-center justify-center gap-6">
              {tiers().map((tier) =>
              <div key={tier.name} className="flex flex-col items-center gap-1">
                  <ShieldIcon
                  size={tier.state === 'current' ? 42 : 28}
                  strokeWidth={1.6}
                  className={tier.state === 'current' ? 'float-y' : ''}
                  style={{
                    color: tier.state === 'locked' ? 'hsl(var(--muted))' : tier.color,
                    fill: tier.state === 'locked' ? 'hsl(var(--muted))' : tier.color,
                    fillOpacity: tier.state === 'current' ? 0.85 : 0.3
                  }} />

                  <span
                  className={[
                  'font-sans text-caption',
                  tier.state === 'current' ?
                  'font-bold text-foreground' :
                  'text-mutedfg'].
                  join(' ')}>

                    {tier.name}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-3 text-center font-sans text-footnote text-mutedfg">
              {t.leagueSub} · {t.leagueEnds}
            </p>
          </div>
        </section>

        <section className="px-4">
          <div className="overflow-hidden rounded-card border border-cardborder bg-card">
            {leagueRows.map((row, i) => {
              const promoted = i < 3;
              const demoted = i >= leagueRows.length - 2;
              return (
                <React.Fragment key={row.id}>
                  {i === 3 &&
                  <div className="flex items-center gap-2 bg-good/[0.08] px-4 py-[6px]">
                      <ChevronUpIcon size={14} className="text-good" />
                      <span className="font-sans text-caption font-bold tracking-[0.4px] text-good">
                        {t.leaguePromoZone}
                      </span>
                    </div>
                  }
                  {i === leagueRows.length - 2 &&
                  <div className="flex items-center gap-2 bg-destructive/[0.08] px-4 py-[6px]">
                      <ChevronDownIcon size={14} className="text-destructive" />
                      <span className="font-sans text-caption font-bold tracking-[0.4px] text-destructive">
                        {t.leagueDemoteZone}
                      </span>
                    </div>
                  }
                  <div
                    className={[
                    'flex items-center gap-3 px-4 py-3',
                    i === leagueRows.length - 1 ? '' : 'border-b border-hairline',
                    row.you ? 'bg-primary/[0.06]' : ''].
                    join(' ')}>

                    <span className="flex w-[28px] shrink-0 items-center justify-center">
                      {i < 3 ?
                      <MedalIcon size={18} style={{ color: MEDAL_COLORS[i] }} /> :

                      <span className="font-sans text-subhead font-bold tabular-nums text-mutedfg">
                          {i + 1}
                        </span>
                      }
                    </span>
                    <Avatar name={row.name} seed={row.id + 3} size={32} />
                    <span
                      className={[
                      'min-w-0 flex-1 truncate font-sans text-subhead',
                      row.you ? 'font-bold text-primary' : 'font-medium text-foreground'].
                      join(' ')}>

                      {row.name}
                      {row.you &&
                      <span className="ml-2 rounded-full bg-primary px-2 py-[1px] font-sans text-[10px] font-bold text-primaryfg">
                          {t.leagueYou}
                        </span>
                      }
                    </span>
                    <span
                      className={[
                      'shrink-0 font-sans text-subhead font-semibold tabular-nums',
                      promoted ? 'text-good' : demoted ? 'text-destructive' : 'text-mutedfg'].
                      join(' ')}>

                      {row.xp} XP
                    </span>
                  </div>
                </React.Fragment>);

            })}
          </div>
        </section>
      </div>
    </PushScreen>);

}
