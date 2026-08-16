import React, { useEffect, useRef, useState } from 'react';
import { CheckIcon, CoinsIcon, LockIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { Sheet } from '../components/Sheet';
import { t } from '../strings';
import { formatSum, haptic } from '../tokens';
import { sound } from '../sound';
import { gameState, shopItems } from '../gameData';
import type { ShopItem } from '../gameData';
import { useUI } from '../ui';

const GOLD = 'hsl(42 96% 50%)';

function sections(): {category: ShopItem['category'];header: string;}[] {
  return [
  { category: 'voucher', header: t.shopVouchers },
  { category: 'boost', header: t.shopBoosts },
  { category: 'merch', header: t.shopMerch }];

}


/** Animates a number toward its target — used for the coin balance. */
function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    if (prev.current === target) return;
    const from = prev.current;
    prev.current = target;
    let raf = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / 600, 1);
      setValue(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const settle = window.setTimeout(() => setValue(target), 700);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [target]);
  return value;
}

export function GameShop() {
  const ui = useUI();
  const locked = ui.gameLocked;
  const [, setTick] = useState(0);
  const bump = () => setTick((v) => v + 1);
  const coins = useAnimatedNumber(gameState.coins);
  const [success, setSuccess] = useState<ShopItem | null>(null);

  const featured = shopItems.find((i) => i.popular) ?? shopItems[0];
  const owned = shopItems.filter((i) => gameState.owned.includes(i.id));

  function openDetail(item: ShopItem) {
    haptic('light');
    sound.tap();
    ui.openSheet({
      key: `product-${item.id}`,
      detent: 'medium',
      node: (
        <ProductSheet
          item={item}
          locked={locked}
          onClose={ui.closeSheet}
          onPurchased={(bought) => {
            bump();
            setSuccess(bought);
            window.setTimeout(() => setSuccess(null), 2600);
          }} />)


    });
  }

  return (
    <PushScreen title={t.shopTitle} backTitle={t.tabGame} onBack={ui.pop}>
      <div className="space-y-8 pt-2">
        {/* balance — typographic, no card */}
        <section className="flex items-baseline justify-between px-5">
          <p className="font-sans text-caption font-bold uppercase tracking-[1px] text-mutedfg">
            {t.shopBalance}
          </p>
          <p className="flex items-center gap-2 font-display text-title1 font-bold tabular-nums text-foreground">
            <CoinsIcon size={22} style={{ color: GOLD }} />
            {formatSum(coins)}
          </p>
        </section>

        {locked &&
        <section className="px-4">
            <div className="flex items-center gap-2 rounded-card bg-destructive/[0.07] px-4 py-3">
              <LockIcon size={14} className="shrink-0 text-destructive" />
              <span className="font-sans text-footnote font-medium text-destructive">
                {t.gameLockBody}
              </span>
            </div>
          </section>
        }

        {/* my collection */}
        {owned.length > 0 &&
        <section>
            <h2 className="mb-2 px-5 font-sans text-section font-semibold uppercase text-mutedfg">
              {t.shopCollection}
            </h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
              {owned.map((item) =>
            <div key={item.id} className="w-[104px] shrink-0">
                  <ProductVisual icon={item.icon} height={84} />
                  <p className="mt-1 truncate text-center font-sans text-caption font-semibold text-foreground/80">
                    {item.name}
                  </p>
                </div>
            )}
            </div>
          </section>
        }

        {/* featured product — image first */}
        <section className="px-4">
          <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
            {t.shopFeatured}
          </h2>
          <button
            type="button"
            onClick={() => openDetail(featured)}
            className="product-in w-full overflow-hidden rounded-[20px] border border-cardborder bg-card text-left transition-transform duration-150 ease-out active:scale-[0.985]">

            <ProductVisual icon={featured.icon} height={170} hero />
            <div className="flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <h3 className="font-display text-title3 font-bold text-foreground">
                  {featured.name}
                </h3>
                <p className="mt-1 line-clamp-2 font-sans text-footnote leading-snug text-mutedfg">
                  {featured.desc}
                </p>
              </div>
              <span className="shrink-0 pb-[2px] font-sans text-headline font-bold tabular-nums text-foreground">
                {formatSum(featured.price)}
                <span className="ml-1 font-sans text-caption font-medium text-mutedfg">{t.coinsUnit}</span>
              </span>
            </div>
          </button>
        </section>

        {/* category grids — image-first cards */}
        {sections().map((section) =>
        <section key={section.category} className="px-4">
            <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
              {section.header}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {shopItems.
            filter((item) => item.category === section.category && item.id !== featured.id).
            map((item, i) => {
              const isOwned = gameState.owned.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDetail(item)}
                  className="product-in overflow-hidden rounded-[18px] border border-cardborder bg-card text-left transition-transform duration-150 ease-out active:scale-[0.97]"
                  style={{ animationDelay: `${i * 60}ms` }}>

                      <ProductVisual icon={item.icon} height={104} />
                      <div className="p-3">
                        <p className="truncate font-sans text-subhead font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="mt-[3px] font-sans text-footnote tabular-nums text-mutedfg">
                          {isOwned ?
                      <span className="font-semibold text-good">{t.shopOwned} ✓</span> :

                      t.shopPriceCoins(formatSum(item.price))
                      }
                        </p>
                      </div>
                    </button>);

            })}
            </div>
          </section>
        )}

        <p className="px-8 pb-6 text-center font-sans text-footnote text-mutedfg">
          {t.shopEarnHint}
        </p>
      </div>

      {/* premium success layer */}
      {success &&
      <div className="pointer-events-none absolute inset-x-4 bottom-[36px] z-[60]">
          <div
          className="success-in flex items-center gap-3 rounded-[18px] border border-good/30 bg-card p-3"
          style={{ boxShadow: '0 14px 40px rgb(0 0 0 / 0.22), 0 0 24px hsl(var(--good) / 0.2)' }}>

            <div className="w-[64px] shrink-0">
              <ProductVisual icon={success.icon} height={56} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-subhead font-bold text-foreground">{t.shopSuccessTitle}</p>
              <p className="truncate font-sans text-footnote text-mutedfg">
                {t.shopSuccessBody(success.name)}
              </p>
            </div>
            <span className="pop-in flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-good" style={{ animationDelay: '250ms' }}>
              <CheckIcon size={16} strokeWidth={3.2} className="text-white" />
            </span>
          </div>
        </div>
      }
    </PushScreen>);

}

/* ── product detail sheet ─────────────────────────────── */

function ProductSheet({
  item,
  locked,
  onClose,
  onPurchased





}: {item: ShopItem;locked: boolean;onClose: () => void;onPurchased: (item: ShopItem) => void;}) {
  const [phase, setPhase] = useState<'idle' | 'processing'>('idle');
  const isOwned = gameState.owned.includes(item.id);
  const affordable = gameState.coins >= item.price;
  const missing = item.price - gameState.coins;

  function buy() {
    if (phase !== 'idle' || locked || isOwned && item.id !== 8) return;
    if (item.id === 8 && gameState.energy >= gameState.energyMax) return;
    if (!affordable) return;
    haptic('light');
    sound.tap();
    setPhase('processing');
    window.setTimeout(() => {
      gameState.coins -= item.price;
      if (item.id === 8) gameState.energy = gameState.energyMax;else
      if (!gameState.owned.includes(item.id)) gameState.owned.push(item.id);
      haptic('success');
      sound.purchase();
      onClose();
      onPurchased(item);
    }, 650);
  }

  const repeatable = item.id === 8;
  const energyFull = repeatable && gameState.energy >= gameState.energyMax;
  const blocked = locked || isOwned && !repeatable || energyFull;

  return (
    <Sheet detent="medium" onClose={onClose}>
      <div className="px-4">
        <ProductVisual icon={item.icon} height={160} hero />
        <h2 className="mt-4 font-display text-title2 font-bold text-foreground">{item.name}</h2>
        <p className="mt-1 font-sans text-subhead leading-snug text-mutedfg">{item.desc}</p>

        {blocked ?
        <div className="mt-2 flex h-[52px] items-center justify-center rounded-[14px] bg-muted font-sans text-subhead font-bold text-mutedfg">
            {locked ? t.gameLockPill : energyFull ? t.energyIsFull : `${t.shopOwned} ✓`}
          </div> :
        affordable ?
        <button
          type="button"
          onClick={buy}
          disabled={phase === 'processing'}
          className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-primary font-sans text-[17px] font-bold text-primaryfg transition-transform duration-100 ease-out active:scale-[0.97]">

            {phase === 'processing' ?
          t.shopProcessing :

          <>
                <CoinsIcon size={17} style={{ color: 'hsl(48 100% 82%)' }} />
                {formatSum(item.price)} · {t.shopGet}
              </>
          }
          </button> :

        <div className="mt-2 rounded-[14px] bg-warn/[0.09] p-4">
            <p className="font-sans text-subhead font-bold text-foreground">
              {t.shopNeedMore(formatSum(missing))}
            </p>
            <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-muted">
              <div
              className="h-full rounded-full bg-warn"
              style={{ width: `${Math.min(gameState.coins / item.price, 1) * 100}%` }} />

            </div>
            <p className="mt-2 font-sans text-footnote tabular-nums text-mutedfg">
              {t.shopBalanceOf(formatSum(gameState.coins), formatSum(item.price))} · {t.shopEarnHint}
            </p>
          </div>
        }
      </div>
    </Sheet>);

}

/* ── crafted product visuals (no icon cards) ──────────── */

export function ProductVisual({
  icon,
  height,
  hero




}: {icon: ShopItem['icon'];height: number;hero?: boolean;}) {
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{
        height,
        background: hero ?
        'radial-gradient(120% 90% at 50% 20%, hsl(224 60% 96%), hsl(226 40% 90%))' :
        'radial-gradient(120% 90% at 50% 20%, hsl(224 45% 96%), hsl(226 30% 91%))'
      }}>

      {/* soft floor shadow */}
      <span
        className="absolute bottom-[10%] left-1/2 h-[8%] w-[52%] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgb(15 23 42 / 0.22), transparent 70%)' }} />

      <span className={hero ? 'float-y' : ''} style={{ height: '72%', aspectRatio: '1' }}>
        <ProductArt icon={icon} />
      </span>
    </div>);

}

function ProductArt({ icon }: {icon: ShopItem['icon'];}) {
  switch (icon) {
    case 'notebook':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <rect x="24" y="14" width="56" height="74" rx="5" fill="hsl(228 45% 16%)" />
          <rect x="24" y="14" width="9" height="74" rx="4" fill="hsl(224 94% 55%)" />
          <rect x="76" y="17" width="3" height="68" fill="hsl(40 30% 92%)" />
          <text x="54" y="58" fontSize="26" fontWeight="700" fill="hsl(199 89% 62%)" textAnchor="middle">π</text>
          <line x1="42" y1="70" x2="68" y2="70" stroke="hsl(0 0% 100% / 0.35)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>);

    case 'pen':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <g transform="rotate(40 50 50)">
            <rect x="44" y="10" width="12" height="58" rx="6" fill="hsl(224 94% 55%)" />
            <rect x="44" y="10" width="12" height="12" rx="6" fill="hsl(228 45% 16%)" />
            <polygon points="44,66 56,66 50,84" fill="hsl(228 45% 16%)" />
            <circle cx="50" cy="82" r="2.4" fill="hsl(42 96% 50%)" />
          </g>
        </svg>);

    case 'shirt':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <path
            d="M34 20 L44 14 Q50 20 56 14 L66 20 L80 34 L70 44 L68 38 L68 84 L32 84 L32 38 L30 44 L20 34 Z"
            fill="hsl(228 45% 16%)" />

          <circle cx="50" cy="46" r="9" fill="none" stroke="hsl(199 89% 62%)" strokeWidth="2.5" />
          <path d="M50 40 v12 M44 46 h12" stroke="hsl(199 89% 62%)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>);

    case 'sticker':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <rect x="20" y="26" width="44" height="44" rx="9" fill="hsl(262 88% 62%)" transform="rotate(-8 42 48)" />
          <rect x="36" y="32" width="44" height="44" rx="9" fill="hsl(224 94% 55%)" transform="rotate(6 58 54)" />
          <text x="57" y="63" fontSize="21" fontWeight="700" fill="white" textAnchor="middle" transform="rotate(6 58 54)">∞</text>
          <text x="40" y="52" fontSize="18" fontWeight="700" fill="white" textAnchor="middle" transform="rotate(-8 42 48)">π</text>
        </svg>);

    case 'ticket':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <path
            d="M16 34 H84 Q84 42 90 42 V58 Q84 58 84 66 H16 Q16 58 10 58 V42 Q16 42 16 34 Z"
            fill="hsl(224 94% 55%)" />

          <line x1="62" y1="34" x2="62" y2="66" stroke="white" strokeWidth="2" strokeDasharray="3 4" />
          <text x="38" y="55" fontSize="12" fontWeight="800" fill="white" textAnchor="middle">1 DARS</text>
          <circle cx="72" cy="50" r="6" fill="none" stroke="white" strokeWidth="2" />
        </svg>);

    case 'cookie':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <circle cx="50" cy="52" r="30" fill="hsl(30 55% 55%)" />
          <circle cx="50" cy="52" r="30" fill="none" stroke="hsl(28 50% 44%)" strokeWidth="3" />
          {[[40, 44], [58, 40], [62, 58], [44, 62], [52, 51]].map(([x, y], i) =>
          <circle key={i} cx={x} cy={y} r="3.4" fill="hsl(25 45% 26%)" />
          )}
        </svg>);

    case 'creditcard':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <rect x="14" y="28" width="72" height="46" rx="8" fill="hsl(228 45% 16%)" />
          <rect x="14" y="38" width="72" height="9" fill="hsl(224 94% 55%)" />
          <rect x="22" y="54" width="14" height="10" rx="2" fill="hsl(42 96% 50%)" />
          <text x="78" y="68" fontSize="10" fontWeight="800" fill="hsl(199 89% 62%)" textAnchor="end">−50 000</text>
        </svg>);

    case 'zap':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <polygon
            points="54,10 30,56 46,56 42,90 72,42 54,42"
            fill="hsl(45 96% 55%)"
            stroke="hsl(38 94% 46%)"
            strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0 4px 10px hsl(45 96% 50% / 0.55))' }} />

        </svg>);

    case 'snowflake':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <g stroke="hsl(199 89% 58%)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 3px 9px hsl(199 89% 55% / 0.5))' }}>
            <line x1="50" y1="16" x2="50" y2="84" />
            <line x1="21" y1="33" x2="79" y2="67" />
            <line x1="21" y1="67" x2="79" y2="33" />
            <line x1="50" y1="16" x2="43" y2="25" /><line x1="50" y1="16" x2="57" y2="25" />
            <line x1="50" y1="84" x2="43" y2="75" /><line x1="50" y1="84" x2="57" y2="75" />
          </g>
        </svg>);

    case 'rocket':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <path d="M50 10 Q66 30 60 62 H40 Q34 30 50 10 Z" fill="hsl(224 94% 55%)" />
          <circle cx="50" cy="38" r="7" fill="hsl(228 45% 16%)" stroke="hsl(199 89% 62%)" strokeWidth="2" />
          <path d="M40 56 L28 72 L40 68 Z" fill="hsl(228 45% 16%)" />
          <path d="M60 56 L72 72 L60 68 Z" fill="hsl(228 45% 16%)" />
          <path d="M45 64 Q50 84 55 64 Z" fill="hsl(28 95% 55%)" style={{ filter: 'drop-shadow(0 3px 7px hsl(28 95% 55% / 0.6))' }} />
        </svg>);

  }
}
