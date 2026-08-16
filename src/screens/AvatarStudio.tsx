/**
 * Avatar Studio — full-screen editor for the personal animated avatar.
 * Draft-based: nothing touches the saved profile until "Save".
 * Every selection triggers a small character reaction; save celebrates.
 *
 * Gender-aware: a first-run type step (Boy / Girl) picks the base avatar;
 * categories and items then adapt (hijab for girls, headwear for boys).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRightIcon,
  BanIcon,
  CheckIcon,
  CrownIcon,
  EyeIcon,
  Flower2Icon,
  GlassesIcon,
  ImageIcon,
  Loader2Icon,
  PaletteIcon,
  RainbowIcon,
  RotateCcwIcon,
  ScanFaceIcon,
  ScissorsIcon,
  ShirtIcon,
  SmileIcon,
  XIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AvatarRig } from '../avatar/AvatarRig';
import { AvatarLive } from '../avatar/AvatarLive';
import type { ReactionSignal } from '../avatar/AvatarLive';
import type { AvatarCategory, AvatarConfig, AvatarGender } from '../avatar/avatarTypes';
import {
  ACCESSORY_STYLES,
  BACKGROUNDS,
  BROW_STYLES,
  CLOTHING_COLORS,
  CLOTHING_STYLES,
  DEFAULT_AVATAR,
  EYEWEAR,
  EYE_STYLES,
  FACE_SHAPES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADWEAR_COLORS,
  HEADWEAR_STYLES,
  HIJAB_COLORS,
  HIJAB_STYLES,
  MOUTH_STYLES,
  SKIN_TONES,
  defaultAvatarFor,
  getBackground,
  optionsFor,
  sameAvatarConfig } from
'../avatar/avatarOptions';
import type { ColorOption, ShapeOption } from '../avatar/avatarOptions';
import { getAvatarConfig, saveAvatarConfig } from '../avatar/avatarStore';
import { t } from '../strings';
import { sound } from '../sound';
import { haptic } from '../tokens';
import { useUI } from '../ui';

const TAB_WIDTH = 64;

interface CategoryDef {
  id: AvatarCategory;
  icon: LucideIcon;
  label: () => string;
  /** Omitted = shown for every avatar type. */
  for?: AvatarGender[];
}

const CATEGORIES: CategoryDef[] = [
{ id: 'skin', icon: PaletteIcon, label: () => t.avatarCatSkin },
{ id: 'face', icon: ScanFaceIcon, label: () => t.avatarCatFace },
{ id: 'eyes', icon: EyeIcon, label: () => t.avatarCatEyes },
{ id: 'brows', icon: RainbowIcon, label: () => t.avatarCatBrows },
{ id: 'mouth', icon: SmileIcon, label: () => t.avatarCatMouth },
{ id: 'hair', icon: ScissorsIcon, label: () => t.avatarCatHair },
{ id: 'headwear', icon: CrownIcon, label: () => t.avatarCatHeadwear, for: ['boy'] },
{ id: 'hijab', icon: Flower2Icon, label: () => t.avatarCatHijab, for: ['girl'] },
{ id: 'clothing', icon: ShirtIcon, label: () => t.avatarCatClothing },
{ id: 'accessories', icon: GlassesIcon, label: () => t.avatarCatAccessories },
{ id: 'background', icon: ImageIcon, label: () => t.avatarCatBackground }];


function categoriesFor(gender: AvatarGender): CategoryDef[] {
  return CATEGORIES.filter((c) => !c.for || c.for.includes(gender));
}

/** On clothing cards, flowing hair is shown pinned up so outfits stay visible. */
const TUCKED_HAIR: Record<string, string> = {
  lob: 'bun',
  long: 'bun',
  longwavy: 'bun',
  bob: 'bun',
  braid: 'bun',
  twintails: 'bun',
  ponytail: 'bun',
  wavy: 'short'
};

// ── Small building blocks ────────────────────────────────

function SelectedBadge() {
  return (
    <span className="pop-in absolute right-[6px] top-[6px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary shadow-thumb">
      <CheckIcon size={11} strokeWidth={3} className="text-primaryfg" />
    </span>);

}

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

function OptionCard({ selected, onSelect, ariaLabel, children }: OptionCardProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={onSelect}
      className={[
      'relative aspect-square overflow-hidden rounded-2xl border transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out',
      'active:scale-[0.96] md:hover:-translate-y-[2px] md:hover:shadow-thumb',
      selected ?
      'border-primary bg-primary/[0.07]' :
      'border-cardborder bg-card'].
      join(' ')}>

      {children}
      {selected && <SelectedBadge />}
    </button>);

}

interface SwatchProps {
  color: ColorOption;
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
  size?: 'sm' | 'lg';
  square?: boolean;
}

function Swatch({ color, selected, onSelect, ariaLabel, size = 'sm', square }: SwatchProps) {
  const radius = square ? 'rounded-2xl' : 'rounded-full';
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={onSelect}
      className={[
      'relative shrink-0 transition-transform duration-150 ease-out active:scale-90',
      size === 'lg' ? 'aspect-square w-full' : 'h-[38px] w-[38px]',
      selected ? 'scale-[1.02]' : ''].
      join(' ')}>

      <span
        className={['block h-full w-full border border-black/[0.08]', radius].join(' ')}
        style={{ backgroundColor: color.hex }} />

      <span
        className={[
        'pointer-events-none absolute inset-[-4px] border-2 transition-opacity duration-150',
        radius,
        selected ? 'border-primary opacity-100' : 'border-transparent opacity-0'].
        join(' ')} />

      {selected &&
      <span className="pop-in absolute -bottom-[2px] -right-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full border-2 border-background bg-primary">
          <CheckIcon size={9} strokeWidth={3.4} className="text-primaryfg" />
        </span>
      }
    </button>);

}

function SectionLabel({ children }: {children: React.ReactNode;}) {
  return (
    <h3 className="px-1 pb-2 pt-4 font-sans text-section font-semibold uppercase text-mutedfg first:pt-0">
      {children}
    </h3>);

}

interface StudioDialogProps {
  title: string;
  body: string;
  actions: React.ReactNode;
}

function StudioDialog({ title, body, actions }: StudioDialogProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-8">
      <div className="fade-in absolute inset-0 bg-black/40" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="alert-in relative w-full max-w-[300px] rounded-sheet border border-cardborder bg-card p-5 shadow-sheet">

        <h2 className="text-center font-display text-title3 font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1.5 text-center font-sans text-subhead text-mutedfg">{body}</p>
        <div className="mt-4 flex flex-col gap-2">{actions}</div>
      </div>
    </div>);

}

function DialogButton({
  tone,
  onClick,
  autoFocus,
  children
}: {
  tone: 'primary' | 'quiet' | 'destructive';
  onClick: () => void;
  autoFocus?: boolean;
  children: React.ReactNode;
}) {
  const cls =
  tone === 'primary' ?
  'bg-primary text-primaryfg' :
  tone === 'destructive' ?
  'bg-destructive/[0.12] text-destructive' :
  'bg-secondary text-foreground';
  return (
    <button
      type="button"
      autoFocus={autoFocus}
      onClick={onClick}
      className={[
      'h-[44px] rounded-input font-sans text-callout font-semibold transition-[transform,opacity] duration-100 ease-out active:scale-[0.98] active:opacity-80',
      cls].
      join(' ')}>

      {children}
    </button>);

}

/** Structurally centered save-success indicator (req: exact avatar center). */
function SaveSuccess() {
  const sparkle = (dx: string, dy: string, delay: string) =>
  <span
    className="star-scatter absolute left-1/2 top-1/2 h-[6px] w-[6px] rounded-full bg-white/90"
    style={
    {
      '--dx': dx,
      '--dy': dy,
      animationDelay: delay
    } as React.CSSProperties
    } />;


  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

      <span className="av-check-in relative flex h-[56px] w-[56px] items-center justify-center rounded-full bg-good shadow-sheet">
        <span className="av-check-mark flex">
          <CheckIcon size={30} strokeWidth={3.4} className="text-white" />
        </span>
        {sparkle('-42px', '-30px', '120ms')}
        {sparkle('44px', '-24px', '180ms')}
        {sparkle('0px', '-48px', '240ms')}
      </span>
    </span>);

}

// ── Studio ───────────────────────────────────────────────

export function AvatarStudio({ seed }: {seed: number;}) {
  const ui = useUI();
  const savedConfig = useMemo(() => getAvatarConfig(seed), [seed]);
  const [step, setStep] = useState<'type' | 'edit'>(savedConfig ? 'edit' : 'type');
  const [baseline, setBaseline] = useState<AvatarConfig>(savedConfig ?? DEFAULT_AVATAR);
  const [draft, setDraft] = useState<AvatarConfig>(savedConfig ?? DEFAULT_AVATAR);
  const [cat, setCat] = useState<AvatarCategory>('skin');
  const [reaction, setReaction] = useState<ReactionSignal | null>(null);
  const [phase, setPhase] = useState<'edit' | 'saving' | 'saved'>('edit');
  const [dialog, setDialog] = useState<null | 'discard' | 'reset' | 'switch' | 'error'>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<Set<number>>(new Set());
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const cats = categoriesFor(draft.gender);
  const catIndex = Math.max(0, cats.findIndex((c) => c.id === cat));
  const dirty = step === 'edit' && !sameAvatarConfig(draft, baseline);
  const stageBg = getBackground(draft.background);

  const after = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  useEffect(() => {
    const pool = timers.current;
    return () => pool.forEach((id) => window.clearTimeout(id));
  }, []);

  const ping = useCallback((kind: ReactionSignal['kind']) => {
    setReaction((prev) => ({ kind, n: (prev?.n ?? 0) + 1 }));
  }, []);

  const leave = useCallback(() => {
    setLeaving(true);
    after(210, ui.closeFullScreen);
  }, [after, ui.closeFullScreen]);

  const attemptClose = useCallback(() => {
    if (phase !== 'edit') return;
    if (dirty) {
      haptic('warning');
      setDialog('discard');
    } else {
      leave();
    }
  }, [dirty, leave, phase]);

  // Escape closes the top-most layer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (dialog) setDialog(null);else
      attemptClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, attemptClose]);

  // Keep the active tab visible.
  useEffect(() => {
    tabRefs.current[cat]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }, [cat]);

  function selectCat(next: AvatarCategory) {
    if (next === cat) return;
    sound.tap();
    haptic('light');
    setCat(next);
  }

  function choose(patch: Partial<AvatarConfig>, kind: ReactionSignal['kind']) {
    setDraft((d) => ({ ...d, ...patch }));
    ping(kind);
    sound.select();
    haptic('light');
  }

  function toggleAccessory(id: string) {
    setDraft((d) => {
      const has = d.accessories.includes(id);
      const next = has ?
      d.accessories.filter((a) => a !== id) :
      [...d.accessories.filter((a) => !(EYEWEAR.has(id) && EYEWEAR.has(a))), id];
      return { ...d, accessories: next };
    });
    ping('accessories');
    sound.select();
    haptic('light');
  }

  /** First-run type selection. */
  function chooseType(gender: AvatarGender) {
    const base = defaultAvatarFor(gender);
    setDraft(base);
    if (!savedConfig) setBaseline(base);
    setStep('edit');
    setCat('skin');
    ping('celebrate');
    sound.select();
    haptic('light');
  }

  /** Later switch between avatar types — confirms if anything was customized. */
  function requestTypeSwitch() {
    const customized = !sameAvatarConfig(draft, defaultAvatarFor(draft.gender));
    if (customized || savedConfig) {
      haptic('warning');
      setDialog('switch');
    } else {
      applyTypeSwitch();
    }
  }

  function applyTypeSwitch() {
    const next: AvatarGender = draft.gender === 'boy' ? 'girl' : 'boy';
    setDialog(null);
    setDraft(defaultAvatarFor(next));
    // Gender-only categories swap to their counterpart; others survive.
    setCat((prev) => prev === 'headwear' ? 'hijab' : prev === 'hijab' ? 'headwear' : prev);
    ping('face');
    sound.tap();
  }

  function save() {
    if (phase !== 'edit' || step !== 'edit') return;
    setPhase('saving');
    after(560, () => {
      try {
        // DevPanel's "Error" data state simulates a failing backend.
        if (ui.dataState === 'error') throw new Error('simulated save failure');
        saveAvatarConfig(seed, draft);
      } catch {
        setPhase('edit');
        setDialog('error');
        haptic('warning');
        return;
      }
      setPhase('saved');
      ping('celebrate');
      sound.purchase();
      haptic('success');
      after(1050, () => {
        leave();
        ui.toast(t.avatarSaved, 'success');
      });
    });
  }

  function resetDraft() {
    setDraft(defaultAvatarFor(draft.gender));
    setDialog(null);
    ping('face');
    sound.tap();
  }

  // ── Option panes ───────────────────────────────────────

  function shapeCards(
  category: AvatarCategory,
  styles: ShapeOption[],
  cols: string,
  crop: 'bust' | 'face',
  patchOf: (id: string) => Partial<AvatarConfig>,
  selectedId: string,
  previewOf?: (id: string) => Partial<AvatarConfig>)
  {
    const label = cats[catIndex].label();
    return (
      <div className={['grid gap-3', cols].join(' ')}>
        {styles.map((s, i) =>
        <OptionCard
          key={s.id}
          selected={selectedId === s.id}
          onSelect={() => choose(patchOf(s.id), category)}
          ariaLabel={`${label} — ${t.avatarOptionLabel(i + 1)}`}>

            <AvatarRig
            config={{ ...draft, ...patchOf(s.id), ...previewOf?.(s.id) ?? {} }}
            crop={crop}
            className="h-full w-full" />

          </OptionCard>
        )}
      </div>);

  }

  function colorRow(
  colors: ColorOption[],
  selectedId: string,
  onPick: (id: string) => void)
  {
    return (
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 pt-1">
        {colors.map((c, i) =>
        <Swatch
          key={c.id}
          color={c}
          selected={selectedId === c.id}
          onSelect={() => onPick(c.id)}
          ariaLabel={`${t.avatarColorHeader} ${i + 1}`} />

        )}
      </div>);

  }

  let pane: React.ReactNode = null;
  if (step === 'edit') {
    if (cat === 'skin') {
      pane =
      <div className="grid grid-cols-4 gap-4 px-1 pt-1">
          {SKIN_TONES.map((c, i) =>
        <Swatch
          key={c.id}
          color={c}
          size="lg"
          selected={draft.skin === c.id}
          onSelect={() => choose({ skin: c.id }, 'skin')}
          ariaLabel={`${t.avatarCatSkin} ${i + 1}`} />

        )}
        </div>;

    } else if (cat === 'face') {
      pane = shapeCards(
        'face',
        optionsFor(FACE_SHAPES, draft.gender),
        'grid-cols-3',
        'face',
        (id) => ({ face: id }),
        draft.face
      );
    } else if (cat === 'eyes') {
      pane = shapeCards(
        'eyes',
        optionsFor(EYE_STYLES, draft.gender),
        'grid-cols-4',
        'face',
        (id) => ({ eyes: id }),
        draft.eyes
      );
    } else if (cat === 'brows') {
      pane = shapeCards(
        'brows',
        optionsFor(BROW_STYLES, draft.gender),
        'grid-cols-4',
        'face',
        (id) => ({ brows: id }),
        draft.brows
      );
    } else if (cat === 'mouth') {
      pane = shapeCards(
        'mouth',
        optionsFor(MOUTH_STYLES, draft.gender),
        'grid-cols-4',
        'face',
        (id) => ({ mouth: id }),
        draft.mouth
      );
    } else if (cat === 'hair') {
      pane =
      <>
          <SectionLabel>{t.avatarColorHeader}</SectionLabel>
          {colorRow(HAIR_COLORS, draft.hairColor, (id) => choose({ hairColor: id }, 'hair'))}
          <SectionLabel>{t.avatarStyleHeader}</SectionLabel>
          {shapeCards(
        'hair',
        optionsFor(HAIR_STYLES, draft.gender),
        'grid-cols-3',
        'face',
        (id) => ({ hair: id }),
        draft.hair,
        // Cards always show the hairstyle itself, even under a hijab.
        () => ({ hijab: 'none' })
        )}
        </>;

    } else if (cat === 'headwear') {
      pane =
      <>
          <SectionLabel>{t.avatarColorHeader}</SectionLabel>
          {colorRow(HEADWEAR_COLORS, draft.headwearColor, (id) =>
        choose({ headwearColor: id }, 'headwear')
        )}
          <SectionLabel>{t.avatarStyleHeader}</SectionLabel>
          {shapeCards(
        'headwear',
        optionsFor(HEADWEAR_STYLES, draft.gender),
        'grid-cols-3',
        'face',
        (id) => ({ headwear: id }),
        draft.headwear
        )}
        </>;

    } else if (cat === 'hijab') {
      pane =
      <>
          <SectionLabel>{t.avatarColorHeader}</SectionLabel>
          {colorRow(HIJAB_COLORS, draft.hijabColor, (id) => choose({ hijabColor: id }, 'hijab'))}
          <SectionLabel>{t.avatarStyleHeader}</SectionLabel>
          {shapeCards(
        'hijab',
        optionsFor(HIJAB_STYLES, draft.gender),
        'grid-cols-3',
        // Full bust: each hijab's drape silhouette is its identity.
        'bust',
        (id) => ({ hijab: id }),
        draft.hijab
        )}
        </>;

    } else if (cat === 'clothing') {
      pane =
      <>
          <SectionLabel>{t.avatarColorHeader}</SectionLabel>
          {colorRow(CLOTHING_COLORS, draft.clothingColor, (id) =>
        choose({ clothingColor: id }, 'clothing')
        )}
          <SectionLabel>{t.avatarStyleHeader}</SectionLabel>
          {shapeCards(
        'clothing',
        optionsFor(CLOTHING_STYLES, draft.gender),
        'grid-cols-3',
        'bust',
        (id) => ({ clothing: id }),
        draft.clothing,
        // Long hair is pinned up on the cards so the outfit stays readable.
        () => TUCKED_HAIR[draft.hair] ? { hair: TUCKED_HAIR[draft.hair] } : {}
        )}
        </>;

    } else if (cat === 'accessories') {
      const list = optionsFor(ACCESSORY_STYLES, draft.gender);
      pane =
      <div className="grid grid-cols-3 gap-3">
          <OptionCard
          selected={draft.accessories.length === 0}
          onSelect={() => {
            setDraft((d) => ({ ...d, accessories: [] }));
            ping('accessories');
            sound.tap();
            haptic('light');
          }}
          ariaLabel={`${t.avatarCatAccessories} — ${t.avatarNone}`}>

            <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-secondary/60">
              <BanIcon size={22} className="text-mutedfg" />
              <span className="font-sans text-caption font-medium text-mutedfg">
                {t.avatarNone}
              </span>
            </span>
          </OptionCard>
          {list.map((s, i) =>
        <OptionCard
          key={s.id}
          selected={draft.accessories.includes(s.id)}
          onSelect={() => toggleAccessory(s.id)}
          ariaLabel={`${t.avatarCatAccessories} — ${t.avatarOptionLabel(i + 1)}`}>

              <AvatarRig
            config={{
              ...draft,
              accessories: [s.id],
              // bare head keeps the accessory readable on the tiny card
              headwear: s.id === 'earrings' ? 'none' : draft.headwear,
              hijab: s.id === 'earrings' ? 'none' : draft.hijab
            }}
            crop={s.id === 'necklace' ? 'bust' : 'face'}
            className="h-full w-full" />

            </OptionCard>
        )}
        </div>;

    } else {
      pane =
      <div className="grid grid-cols-4 gap-4 px-1 pt-1">
          {BACKGROUNDS.map((c, i) =>
        <Swatch
          key={c.id}
          color={c}
          size="lg"
          square
          selected={draft.background === c.id}
          onSelect={() => choose({ background: c.id }, 'background')}
          ariaLabel={`${t.avatarCatBackground} ${i + 1}`} />

        )}
        </div>;

    }
  }

  // ── Layout ─────────────────────────────────────────────

  return (
    <div
      className={[
      'absolute inset-0 z-50 flex flex-col bg-background',
      leaving ?
      'translate-y-[12px] opacity-0 transition-[transform,opacity] duration-200 ease-in' :
      'studio-in'].
      join(' ')}>

      {/* Header */}
      <header className="relative z-10 flex h-[92px] shrink-0 items-end justify-between px-2 pb-1">
        <button
          type="button"
          onClick={attemptClose}
          aria-label={t.avatarClose}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full text-foreground/70 transition-[transform,opacity] duration-100 ease-out active:scale-[0.94] active:opacity-70">

          <XIcon size={24} strokeWidth={2.2} />
        </button>
        <div className="pointer-events-none absolute inset-x-[88px] bottom-[6px] text-center">
          <h1 className="truncate font-display text-headline font-semibold text-foreground">
            {step === 'type' ? t.avatarTypeTitle : t.avatarStudioTitle}
          </h1>
          <p className="truncate font-sans text-caption text-mutedfg">
            {step === 'type' ? t.avatarTypeSubtitle : t.avatarStudioSubtitle}
          </p>
        </div>
        {step === 'edit' ?
        <button
          type="button"
          onClick={save}
          disabled={phase !== 'edit'}
          className="mr-2 flex h-[34px] min-w-[86px] items-center justify-center gap-1.5 rounded-full bg-primary px-4 font-sans text-subhead font-semibold text-primaryfg transition-[transform,opacity] duration-100 ease-out active:scale-[0.96] disabled:opacity-70">

            {phase === 'saving' ?
          <Loader2Icon size={15} className="animate-spin" /> :
          phase === 'saved' ?
          <CheckIcon size={15} strokeWidth={3} /> :
          null}
            {phase === 'saved' ? t.avatarSavedShort : t.avatarSave}
          </button> :

        <span className="mr-2 min-w-[86px]" />
        }
      </header>

      {step === 'type' ?
      <div className="options-in flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-14">
          <div className="grid w-full max-w-[430px] grid-cols-2 gap-4">
            {(['boy', 'girl'] as AvatarGender[]).map((g) =>
          <button
            key={g}
            type="button"
            onClick={() => chooseType(g)}
            aria-label={g === 'boy' ? t.avatarBoy : t.avatarGirl}
            className="group rounded-3xl border border-cardborder bg-card p-[10px] pb-3 transition-[transform,border-color,box-shadow] duration-200 ease-out active:scale-[0.96] md:hover:-translate-y-[3px] md:hover:border-primary/50 md:hover:shadow-sheet">

                <span className="block overflow-hidden rounded-2xl">
                  <AvatarRig
                config={defaultAvatarFor(g)}
                crop="bust"
                className="block h-full w-full transition-transform duration-300 ease-out group-active:scale-[1.04]" />

                </span>
                <span className="mt-2.5 block text-center font-display text-headline font-semibold text-foreground">
                  {g === 'boy' ? t.avatarBoy : t.avatarGirl}
                </span>
              </button>
          )}
          </div>
        </div> :

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Preview */}
          <div className="flex shrink-0 items-center justify-center px-6 pb-4 pt-1 md:flex-1 md:pb-8">
            <div className="av-float relative w-full max-w-[270px] md:max-w-[380px]">
              <div
              className="relative aspect-square overflow-hidden rounded-[36px]"
              style={{
                boxShadow: `0 24px 48px -24px ${stageBg.shade}, 0 8px 20px -12px rgb(0 0 0 / 0.18)`
              }}>

                <AvatarLive
                config={draft}
                animated={phase !== 'saving'}
                reaction={reaction}
                className="block h-full w-full"
                label={t.avatarStudioTitle} />


                {phase === 'saved' && <SaveSuccess />}
              </div>

              <button
              type="button"
              onClick={requestTypeSwitch}
              aria-label={t.avatarSwitchLabel}
              className="absolute left-3 top-3 flex h-[30px] items-center gap-1.5 rounded-full bg-black/[0.22] px-3 font-sans text-caption font-semibold text-white backdrop-blur-md transition-[transform,opacity] duration-100 ease-out active:scale-[0.95] active:opacity-80">

                <ArrowLeftRightIcon size={12} strokeWidth={2.6} />
                {draft.gender === 'boy' ? t.avatarBoy : t.avatarGirl}
              </button>

              <button
              type="button"
              onClick={() => setDialog('reset')}
              className="absolute right-3 top-3 flex h-[30px] items-center gap-1.5 rounded-full bg-black/[0.22] px-3 font-sans text-caption font-semibold text-white backdrop-blur-md transition-[transform,opacity] duration-100 ease-out active:scale-[0.95] active:opacity-80">

                <RotateCcwIcon size={12} strokeWidth={2.6} />
                {t.avatarReset}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex min-h-0 flex-1 flex-col md:max-w-[430px] md:flex-none md:basis-[430px] md:border-l md:border-hairline">
            {/* Category tabs */}
            <div className="no-scrollbar shrink-0 overflow-x-auto border-b border-hairline">
              <div className="relative flex min-w-max px-2 py-2">
                <div
                aria-hidden="true"
                className="absolute bottom-2 top-2 rounded-xl bg-primary/[0.09]"
                style={{
                  width: TAB_WIDTH,
                  transform: `translateX(${catIndex * TAB_WIDTH}px)`,
                  transition: 'transform 280ms cubic-bezier(0.23, 1, 0.32, 1)'
                }} />

                {cats.map((c) => {
                const Icon = c.icon;
                const active = c.id === cat;
                return (
                  <button
                    key={c.id}
                    ref={(el) => {
                      tabRefs.current[c.id] = el;
                    }}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectCat(c.id)}
                    style={{ width: TAB_WIDTH }}
                    className="relative z-10 flex flex-col items-center gap-[3px] rounded-xl py-[7px] transition-[transform] duration-100 ease-out active:scale-[0.94]">

                      <Icon
                      size={20}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={active ? 'text-primary' : 'text-mutedfg'} />

                      <span
                      className={[
                      'max-w-[60px] truncate font-sans text-tab font-medium',
                      active ? 'text-primary' : 'text-mutedfg'].
                      join(' ')}>

                        {c.label()}
                      </span>
                    </button>);

              })}
              </div>
            </div>

            {/* Options */}
            <div
            key={`${draft.gender}-${cat}`}
            className="options-in no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>

              {pane}
            </div>
          </div>
        </div>
      }

      {/* Dialogs */}
      {dialog === 'discard' &&
      <StudioDialog
        title={t.avatarDiscardTitle}
        body={t.avatarDiscardBody}
        actions={
        <>
              <DialogButton tone="primary" autoFocus onClick={() => setDialog(null)}>
                {t.avatarKeepEditing}
              </DialogButton>
              <DialogButton
            tone="destructive"
            onClick={() => {
              setDialog(null);
              leave();
            }}>

                {t.avatarDiscard}
              </DialogButton>
            </>
        } />

      }
      {dialog === 'reset' &&
      <StudioDialog
        title={t.avatarResetTitle}
        body={t.avatarResetBody}
        actions={
        <>
              <DialogButton tone="primary" autoFocus onClick={() => setDialog(null)}>
                {t.avatarKeepEditing}
              </DialogButton>
              <DialogButton tone="destructive" onClick={resetDraft}>
                {t.avatarResetConfirm}
              </DialogButton>
            </>
        } />

      }
      {dialog === 'switch' &&
      <StudioDialog
        title={t.avatarSwitchTitle}
        body={t.avatarSwitchBody}
        actions={
        <>
              <DialogButton tone="primary" autoFocus onClick={() => setDialog(null)}>
                {t.cancel}
              </DialogButton>
              <DialogButton tone="destructive" onClick={applyTypeSwitch}>
                {t.avatarSwitchConfirm}
              </DialogButton>
            </>
        } />

      }
      {dialog === 'error' &&
      <StudioDialog
        title={t.avatarSaveError}
        body={t.avatarSaveErrorBody}
        actions={
        <>
              <DialogButton
            tone="primary"
            autoFocus
            onClick={() => {
              setDialog(null);
              save();
            }}>

                {t.avatarRetry}
              </DialogButton>
              <DialogButton tone="quiet" onClick={() => setDialog(null)}>
                {t.avatarKeepEditing}
              </DialogButton>
            </>
        } />

      }
    </div>);

}
