/**
 * AvatarRig — the layered SVG character.
 *
 * Pure and presentational: (config, pose) → SVG. Every layer (background,
 * clothing, head, eyes, hair, headwear, accessories) is independently
 * replaceable and driven by the catalogs in avatarOptions.ts. All motion is
 * transform/opacity only, so it stays GPU-friendly at 60fps.
 *
 * Coordinate system: 240×240 viewBox, chin baseline y=148, center x=120.
 * Hair/headwear are authored for the default head and re-anchored to the
 * chosen face shape with a scale transform.
 */

import React, { useId } from 'react';
import type { AvatarConfig, AvatarPose } from './avatarTypes';
import { NEUTRAL_POSE } from './avatarTypes';
import {
  COVERING_HEADWEAR,
  HAIR_UNDER_HAT,
  getBackground,
  getClothingColor,
  getHairColor,
  getHeadwearColor,
  getHijabColor,
  getHijabStyle,
  getSkin } from
'./avatarOptions';

// ── Fixed palette ────────────────────────────────────────
const INK = '#39332D';
const MOUTH_DARK = '#4A322B';
const TONGUE = '#E8837A';
const GOLD = '#E9B94F';
const FRAME = '#3A3E46';
const LENS = '#2E3138';
const JACKET_INNER = '#2E3138';
const POM_CREAM = '#F6F1E7';
const TIE_RED = '#A63A4C';
const BLUSH_PINK = '#F2788C';

const EASE_SOFT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_SPRING = 'cubic-bezier(0.34, 1.3, 0.64, 1)';

const FACE_GEOMETRY: Record<string, {w: number;h: number;r: number;}> = {
  soft: { w: 94, h: 98, r: 36 },
  round: { w: 97, h: 95, r: 47 },
  square: { w: 96, h: 95, r: 24 },
  slim: { w: 86, h: 100, r: 36 },
  wide: { w: 105, h: 92, r: 40 }
};

/** Chin fullness for the girl head (fraction of half-width kept at the chin). */
const GIRL_CHIN: Record<string, number> = {
  soft: 0.5,
  round: 0.62,
  square: 0.7,
  slim: 0.44,
  wide: 0.58
};

/**
 * Girl head — a soft egg with full cheeks and a rounded, gently tapered
 * chin, designed together with the hijab opening (its curve mirrors this).
 */
function girlHeadPath(w: number, h: number, chinF: number): string {
  const hw = w / 2;
  const top = 148 - h;
  const cw = hw * chinF;
  return [
  `M 120 ${top}`,
  `C ${120 + hw * 0.6} ${top} ${120 + hw} ${top + h * 0.24} ${120 + hw} ${(top + h * 0.5).toFixed(1)}`,
  `C ${120 + hw} ${(top + h * 0.75).toFixed(1)} ${120 + cw} 148 120 148`,
  `C ${120 - cw} 148 ${120 - hw} ${(top + h * 0.75).toFixed(1)} ${120 - hw} ${(top + h * 0.5).toFixed(1)}`,
  `C ${120 - hw} ${top + h * 0.24} ${120 - hw * 0.6} ${top} 120 ${top}`,
  'Z'].
  join(' ');
}

const EYE_Y = 104;
const EYE_DX = 20;
const STAR =
'M0,-5.6 L1.35,-1.86 L5.33,-1.73 L2.19,0.71 L3.29,4.53 L0,2.3 L-3.29,4.53 L-2.19,0.71 L-5.33,-1.73 L-1.35,-1.86 Z';

export interface AvatarRigProps {
  config: AvatarConfig;
  pose?: AvatarPose;
  /** 'face' is a tight crop for small avatars; 'bust' shows the shoulders. */
  crop?: 'bust' | 'face';
  /** Enables the continuous CSS loops (breathing, hair sway). */
  idleMotion?: boolean;
  className?: string;
  label?: string;
}

interface Ctx {
  uid: string;
  config: AvatarConfig;
  pose: AvatarPose;
  skin: {hex: string;shade: string;};
  hairC: {hex: string;shade: string;};
  hatC: {hex: string;shade: string;};
  hijabC: {hex: string;shade: string;};
  clothC: {hex: string;shade: string;};
  geo: {w: number;h: number;r: number;};
  idleMotion: boolean;
  /** True when a hijab is worn — hair layers are skipped entirely. */
  hijabOn: boolean;
}

// ── Eyes ─────────────────────────────────────────────────
function EyeSide({ ctx, side }: {ctx: Ctx;side: -1 | 1;}) {
  const { pose, uid } = ctx;
  let style = ctx.config.eyes;
  if (style === 'wink') style = side === 1 ? 'happy' : 'classic';
  const cx = 120 + side * EYE_DX;
  const px = pose.pupilX * 2.6;
  const py = pose.pupilY * 1.8;
  const closable = style !== 'happy';
  const squash = style === 'sleepy' ? 0.45 : 0.14;
  const scaleY = closable ? 1 - pose.blink * (1 - squash) : 1;

  const pupilGroup = (children: React.ReactNode) =>
  <g
    style={{
      transform: `translate(${px}px, ${py}px)`,
      transition: `transform 260ms ${EASE_SOFT}`
    }}>
      {children}
    </g>;


  let inner: React.ReactNode = null;
  if (style === 'classic') {
    inner =
    <>
        <ellipse cx={cx} cy={EYE_Y} rx={9} ry={10} fill="#FFFFFF" />
        {pupilGroup(
        <>
            <circle cx={cx} cy={EYE_Y} r={4.3} fill={INK} />
            <circle cx={cx - 1.4} cy={EYE_Y - 1.7} r={1.5} fill="#FFFFFF" />
          </>
      )}
      </>;

  } else if (style === 'round') {
    inner =
    <>
        <circle cx={cx} cy={EYE_Y} r={11} fill="#FFFFFF" />
        {pupilGroup(
        <>
            <circle cx={cx} cy={EYE_Y} r={5.2} fill={INK} />
            <circle cx={cx - 1.7} cy={EYE_Y - 2} r={1.8} fill="#FFFFFF" />
          </>
      )}
      </>;

  } else if (style === 'wide') {
    inner =
    <>
        <ellipse cx={cx} cy={EYE_Y} rx={7.5} ry={11.5} fill="#FFFFFF" />
        {pupilGroup(
        <>
            <circle cx={cx} cy={EYE_Y} r={4} fill={INK} />
            <circle cx={cx - 1.3} cy={EYE_Y - 1.6} r={1.4} fill="#FFFFFF" />
          </>
      )}
      </>;

  } else if (style === 'sleepy') {
    const clipId = `${uid}-sl${side === 1 ? 'r' : 'l'}`;
    inner =
    <>
        <clipPath id={clipId}>
          <path d={`M ${cx - 9.5} ${EYE_Y} A 9.5 9.5 0 0 0 ${cx + 9.5} ${EYE_Y} Z`} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <ellipse cx={cx} cy={EYE_Y} rx={9.5} ry={9.5} fill="#FFFFFF" />
          {pupilGroup(<circle cx={cx} cy={EYE_Y + 2.5} r={4.2} fill={INK} />)}
        </g>
        <path
        d={`M ${cx - 9.5} ${EYE_Y} Q ${cx} ${EYE_Y - 3} ${cx + 9.5} ${EYE_Y}`}
        stroke={INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none" />
      </>;

  } else if (style === 'happy') {
    inner =
    <path
      d={`M ${cx - 8} ${EYE_Y + 2} Q ${cx} ${EYE_Y - 7} ${cx + 8} ${EYE_Y + 2}`}
      stroke={INK}
      strokeWidth={3.6}
      strokeLinecap="round"
      fill="none" />;

  } else if (style === 'starry') {
    inner =
    <>
        <circle cx={cx} cy={EYE_Y} r={10.5} fill="#FFFFFF" />
        {pupilGroup(
        <path transform={`translate(${cx} ${EYE_Y})`} d={STAR} fill={GOLD} />
      )}
      </>;

  } else {
    // dot
    inner = pupilGroup(<circle cx={cx} cy={EYE_Y} r={4.8} fill={INK} />);
  }

  // Girl avatars get small outer lashes — part of their visual identity.
  const LASH_RIM: Record<string, [number, number]> = {
    classic: [9, 10],
    round: [11, 11],
    wide: [7.5, 11.5],
    sleepy: [9.5, 5],
    starry: [10.5, 10.5]
  };
  let lashes: React.ReactNode = null;
  if (ctx.config.gender === 'girl' && style !== 'dot') {
    const ox = side; // outer direction: away from the nose
    if (style === 'happy') {
      lashes =
      <path
        d={`M ${cx + ox * 8} ${EYE_Y + 2} Q ${cx + ox * 11} ${EYE_Y + 2.2} ${cx + ox * 12.5} ${EYE_Y + 3.8}`}
        stroke={INK}
        strokeWidth={1.7}
        strokeLinecap="round"
        fill="none" />;

    } else {
      // Two delicate curved flicks at the upper-outer rim — subtle, not
      // "beauty lashes"; they squash with the blink like real lids.
      const [rx, ry] = LASH_RIM[style] ?? [9, 10];
      const x1 = cx + ox * rx * 0.7;
      const y1 = EYE_Y - ry * 0.74;
      const x2 = cx + ox * rx * 0.98;
      const y2 = EYE_Y - ry * 0.32;
      lashes =
      <g stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none">
          <path d={`M ${x1} ${y1} Q ${x1 + ox * 2.6} ${y1 - 2.2} ${x1 + ox * 4.2} ${y1 - 3.1}`} />
          <path d={`M ${x2} ${y2} Q ${x2 + ox * 2.8} ${y2 - 0.8} ${x2 + ox * 4.6} ${y2 - 1.7}`} />
        </g>;

    }
  }

  return (
    <g
      style={{
        transform: `scaleY(${scaleY})`,
        transformOrigin: `${cx}px ${EYE_Y}px`,
        transformBox: 'view-box',
        transition: 'transform 90ms ease-out'
      }}>
      {inner}
      {lashes}
    </g>);

}

// ── Brows ────────────────────────────────────────────────
function BrowSide({ ctx, side }: {ctx: Ctx;side: -1 | 1;}) {
  const style = ctx.config.brows;
  const girl = ctx.config.gender === 'girl';
  const cx = 120 + side * EYE_DX;
  const y = 88;
  const color = ctx.hairC.shade;
  // Authored with +x pointing toward the nose; the right brow is mirrored.
  // Girls get a slightly finer, softly arched brow.
  let d = girl ? 'M -7.5 1 Q -0.5 -4 7.5 0.5' : 'M -8 1 Q 0 -3 8 1';
  let w = girl ? 2.6 : 3.2;
  let dy = 0;
  if (style === 'straight') d = 'M -8 0 L 8 0';else
  if (style === 'thick') {
    d = 'M -8.5 1 Q 0 -4.5 8.5 1';
    w = 5.6;
  } else if (style === 'thin') w = girl ? 1.8 : 2;else
  if (style === 'arched') d = 'M -8 2 Q -1 -6.5 8 0.5';else
  if (style === 'angled') d = 'M -8 -2 Q 2 -5 8 2.5';else
  if (style === 'playful') {
    if (side === -1) {
      d = 'M -8 2 Q -1 -6 8 0.5';
      dy = -2.5;
    } else {
      d = 'M -8 0.5 Q 0 -2 8 0.5';
    }
  }
  return (
    <g transform={`translate(${cx} ${y + dy}) scale(${side === 1 ? -1 : 1} 1)`}>
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </g>);

}

// ── Mouth ────────────────────────────────────────────────
function MouthShape({ ctx, style }: {ctx: Ctx;style: string;}) {
  const { uid } = ctx;
  const girl = ctx.config.gender === 'girl';
  const y = 131;
  if (style === 'smile') {
    return (
      <path
        d={
        girl ?
        `M 111 ${y - 1.5} Q 120 ${y + 6.5} 129 ${y - 1.5}` :
        `M 110 ${y - 2} Q 120 ${y + 8} 130 ${y - 2}`
        }
        stroke={MOUTH_DARK}
        strokeWidth={girl ? 3.2 : 3.6}
        strokeLinecap="round"
        fill="none" />);


  }
  if (style === 'grin') {
    return (
      <>
        <path
          d={`M 107 ${y - 3} Q 120 ${y + 13} 133 ${y - 3} Q 120 ${y + 2} 107 ${y - 3} Z`}
          fill={MOUTH_DARK} />

        <path
          d={`M 109.5 ${y - 2.4} Q 120 ${y + 7.5} 130.5 ${y - 2.4} Q 120 ${y + 1.4} 109.5 ${y - 2.4} Z`}
          fill="#FFFFFF" />

      </>);

  }
  if (style === 'laugh') {
    const clipId = `${uid}-laugh`;
    return (
      <>
        <clipPath id={clipId}>
          <path d={`M 108 ${y - 1} A 12 12 0 0 0 132 ${y - 1} Z`} />
        </clipPath>
        <path d={`M 108 ${y - 1} A 12 12 0 0 0 132 ${y - 1} Z`} fill={MOUTH_DARK} />
        <g clipPath={`url(#${clipId})`}>
          <rect x={108} y={y - 1} width={24} height={3.6} fill="#FFFFFF" />
          <ellipse cx={120} cy={y + 10} rx={6.5} ry={4.5} fill={TONGUE} />
        </g>
      </>);

  }
  if (style === 'neutral') {
    return (
      <path
        d={`M 113 ${y} L 127 ${y}`}
        stroke={MOUTH_DARK}
        strokeWidth={3.4}
        strokeLinecap="round" />);


  }
  if (style === 'surprised') {
    return <ellipse cx={120} cy={y + 1} rx={4.5} ry={6} fill={MOUTH_DARK} />;
  }
  if (style === 'smirk') {
    return (
      <path
        d={`M 112 ${y + 2} Q 121 ${y + 6.5} 130 ${y - 3}`}
        stroke={MOUTH_DARK}
        strokeWidth={3.6}
        strokeLinecap="round"
        fill="none" />);


  }
  if (style === 'tongue') {
    return (
      <>
        <path
          d={`M 110 ${y - 2} Q 120 ${y + 8} 130 ${y - 2}`}
          stroke={MOUTH_DARK}
          strokeWidth={3.6}
          strokeLinecap="round"
          fill="none" />

        <ellipse cx={126} cy={y + 6} rx={4.6} ry={5.4} fill={TONGUE} />
        <path
          d={`M 126 ${y + 3} L 126 ${y + 9}`}
          stroke={MOUTH_DARK}
          strokeWidth={1}
          opacity={0.35} />

      </>);

  }
  // cat
  return (
    <path
      d={`M 111 ${y} Q 115.5 ${y + 5} 120 ${y} Q 124.5 ${y + 5} 129 ${y}`}
      stroke={MOUTH_DARK}
      strokeWidth={3.2}
      strokeLinecap="round"
      fill="none" />);


}

function Mouth({ ctx }: {ctx: Ctx;}) {
  const { mood } = ctx.pose;
  const fade = `opacity 160ms ease-out`;
  return (
    <>
      <g style={{ opacity: mood === 'idle' ? 1 : 0, transition: fade }}>
        <MouthShape ctx={ctx} style={ctx.config.mouth} />
      </g>
      <g style={{ opacity: mood === 'smile' ? 1 : 0, transition: fade }}>
        <path
          d="M 109 128 Q 120 141 131 128"
          stroke={MOUTH_DARK}
          strokeWidth={3.8}
          strokeLinecap="round"
          fill="none" />

      </g>
      <g style={{ opacity: mood === 'surprised' ? 1 : 0, transition: fade }}>
        <ellipse cx={120} cy={132} rx={5} ry={6.5} fill={MOUTH_DARK} />
      </g>
    </>);

}

// ── Hair ─────────────────────────────────────────────────
function hairPaths(style: string, hex: string, shade: string, idle: boolean) {
  const sway = idle ? 'av-sway' : '';
  const swayBig = idle ? 'av-sway-big' : '';
  let back: React.ReactNode = null;
  let front: React.ReactNode = null;

  if (style === 'buzz') {
    front =
    <path
      d="M 74 88 Q 73 49 120 47 Q 167 49 166 88 Q 166 65 120 62 Q 74 65 74 88 Z"
      fill={hex}
      opacity={0.4} />;

  } else if (style === 'short') {
    front =
    <path
      d="M 73 94 Q 70 46 120 44 Q 170 46 167 94 L 166 96 Q 162 72 146 66 Q 126 59 101 65 Q 80 71 74 96 Z"
      fill={hex} />;

  } else if (style === 'sidepart') {
    front =
    <>
        <path
        d="M 73 96 Q 70 45 120 44 Q 170 45 167 90 Q 156 84 146 66 Q 118 78 92 73 Q 78 70 73 96 Z"
        fill={hex} />

        <path
        d="M 146 66 Q 132 74 112 75"
        stroke={shade}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.5} />
      </>;

  } else if (style === 'messy') {
    front =
    <path
      d="M 72 92 Q 66 70 78 57 Q 74 44 90 42 Q 92 30 106 34 Q 114 22 126 32 Q 140 25 144 40 Q 158 39 156 53 Q 168 61 166 92 Q 152 66 120 63 Q 86 66 72 92 Z"
      fill={hex} />;

  } else if (style === 'spiky') {
    front =
    <path
      d="M 72 92 L 75 58 L 84 31 L 94 54 L 105 24 L 115 52 L 127 22 L 136 52 L 149 28 L 154 55 L 165 45 L 168 92 Q 150 66 120 64 Q 88 66 72 92 Z"
      fill={hex} />;

  } else if (style === 'curly') {
    front =
    <>
        <path
        d="M 72 94 Q 64 76 76 64 Q 68 46 85 39 Q 86 22 104 27 Q 110 13 125 21 Q 141 12 149 28 Q 165 26 163 45 Q 176 52 168 68 Q 178 80 166 94 Q 152 66 120 64 Q 86 66 72 94 Z"
        fill={hex} />

        <circle cx={95} cy={46} r={3} fill={shade} opacity={0.35} />
        <circle cx={122} cy={38} r={3} fill={shade} opacity={0.35} />
        <circle cx={147} cy={48} r={3} fill={shade} opacity={0.35} />
      </>;

  } else if (style === 'wavy') {
    front =
    <path
      d="M 71 118 Q 63 106 70 95 Q 65 48 120 44 Q 175 48 170 95 Q 177 106 169 118 Q 164 96 157 87 Q 158 102 150 110 Q 151 88 141 74 Q 120 64 99 74 Q 89 88 90 110 Q 82 102 83 87 Q 76 96 71 118 Z"
      fill={hex} />;

  } else if (style === 'long') {
    back =
    <path
      className={swayBig}
      d="M 66 188 C 56 150 58 106 66 76 C 74 46 94 40 120 40 C 146 40 166 46 174 76 C 182 106 184 150 174 188 C 170 202 157 203 151 193 C 146 200 134 202 129 195 C 125 201 115 201 111 195 C 106 202 94 200 89 193 C 83 203 70 202 66 188 Z"
      fill={hex} />;

    front =
    <>
        <path
        d="M 74 96 C 70 52 92 42 120 42 C 148 42 170 52 166 96 C 162 78 150 66 136 62 C 126 59 114 59 104 62 C 90 66 78 78 74 96 Z"
        fill={hex} />

        <path d="M 73 86 C 67 106 69 130 78 146 C 84 133 82 108 80 92 Z" fill={hex} />
        <path d="M 167 86 C 173 106 171 130 162 146 C 156 133 158 108 160 92 Z" fill={hex} />
      </>;

  } else if (style === 'bob') {
    back =
    <path
      d="M 70 136 C 58 110 60 76 74 58 C 88 42 152 42 166 58 C 180 76 182 110 170 136 C 166 152 152 157 143 150 C 131 158 109 158 97 150 C 88 157 74 152 70 136 Z"
      fill={hex} />;

    front =
    <path
      d="M 78 84 C 74 50 100 44 120 44 C 140 44 166 50 162 84 C 150 66 134 62 120 62 C 106 62 90 66 78 84 Z"
      fill={hex} />;

  } else if (style === 'ponytail') {
    back =
    <g className={swayBig}>
        <path
        d="M 144 60 C 170 50 186 64 189 90 C 192 118 184 144 170 158 C 162 166 154 160 159 149 C 168 133 172 108 165 89 C 160 73 150 66 141 65 Z"
        fill={hex} />

        <path
        d="M 170 158 C 166 166 158 170 152 166 C 158 162 162 156 164 150 Z"
        fill={hex} />

        <ellipse cx={148} cy={62} rx={5.6} ry={4.2} fill={shade} transform="rotate(-26 148 62)" />
      </g>;

    front =
    <path
      d="M 74 88 C 72 46 96 42 120 42 C 144 42 168 46 166 88 C 158 62 138 58 120 58 C 100 58 82 64 74 88 Z"
      fill={hex} />;

  } else if (style === 'afro') {
    back = <ellipse cx={120} cy={62} rx={61} ry={47} fill={hex} />;
    front =
    <>
        <path
        d="M 76 84 Q 74 50 120 48 Q 166 50 164 84 Q 146 63 120 62 Q 94 63 76 84 Z"
        fill={hex} />

        <circle cx={83} cy={40} r={3.2} fill={shade} opacity={0.3} />
        <circle cx={120} cy={26} r={3.2} fill={shade} opacity={0.3} />
        <circle cx={157} cy={40} r={3.2} fill={shade} opacity={0.3} />
      </>;

  } else if (style === 'bun') {
    back =
    <>
        <circle cx={120} cy={33} r={16} fill={hex} />
        <ellipse cx={120} cy={47} rx={10} ry={4.5} fill={shade} />
      </>;

    front =
    <path
      d="M 74 88 Q 72 46 120 44 Q 168 46 166 88 Q 158 62 120 58 Q 82 62 74 88 Z"
      fill={hex} />;

  } else if (style === 'lob') {
    back =
    <path
      d="M 66 162 C 56 130 58 92 70 68 C 82 44 158 44 170 68 C 182 92 184 130 174 162 C 170 176 157 178 149 170 C 137 179 103 179 91 170 C 83 178 70 176 66 162 Z"
      fill={hex} />;

    front =
    <path
      d="M 76 90 C 72 48 98 43 120 43 C 146 43 168 50 164 94 C 158 76 148 64 136 60 C 118 68 96 70 84 72 C 79 76 77 84 76 90 Z"
      fill={hex} />;

  } else if (style === 'longwavy') {
    back =
    <path
      className={swayBig}
      d="M 62 186 C 50 158 58 132 54 106 C 52 74 72 44 120 42 C 168 44 188 74 186 106 C 182 132 190 158 178 186 C 170 200 158 195 154 186 C 148 196 136 198 131 190 C 126 198 114 198 109 190 C 104 198 92 196 86 186 C 82 195 70 200 62 186 Z"
      fill={hex} />;

    front =
    <path
      d="M 78 96 C 72 50 96 44 120 44 C 144 44 168 50 162 96 C 156 72 138 63 124 61 L 120 66 L 116 61 C 102 63 84 72 78 96 Z"
      fill={hex} />;

  } else if (style === 'twintails') {
    // twin braids — plaited strands with ties and tapered tips
    back =
    <g className={swayBig}>
        <ellipse cx={82} cy={70} rx={5.4} ry={4} fill={shade} transform="rotate(28 82 70)" />
        <ellipse cx={158} cy={70} rx={5.4} ry={4} fill={shade} transform="rotate(-28 158 70)" />
        <ellipse cx={77} cy={82} rx={9} ry={7.4} fill={hex} transform="rotate(18 77 82)" />
        <ellipse cx={82} cy={96} rx={8.4} ry={7} fill={hex} transform="rotate(-16 82 96)" />
        <ellipse cx={76} cy={110} rx={7.8} ry={6.6} fill={hex} transform="rotate(16 76 110)" />
        <ellipse cx={81} cy={123} rx={7.2} ry={6.2} fill={hex} transform="rotate(-14 81 123)" />
        <path d="M 76 128 C 72 138 74 146 79 150 C 83 144 84 134 82 128 Z" fill={hex} />
        <ellipse cx={163} cy={82} rx={9} ry={7.4} fill={hex} transform="rotate(-18 163 82)" />
        <ellipse cx={158} cy={96} rx={8.4} ry={7} fill={hex} transform="rotate(16 158 96)" />
        <ellipse cx={164} cy={110} rx={7.8} ry={6.6} fill={hex} transform="rotate(-16 164 110)" />
        <ellipse cx={159} cy={123} rx={7.2} ry={6.2} fill={hex} transform="rotate(14 159 123)" />
        <path d="M 164 128 C 168 138 166 146 161 150 C 157 144 156 134 158 128 Z" fill={hex} />
      </g>;

    front =
    <path
      d="M 78 84 C 74 48 100 44 120 44 C 140 44 166 48 162 84 C 150 65 134 62 120 62 C 106 62 90 65 78 84 Z"
      fill={hex} />;

  } else if (style === 'braid') {
    back =
    <path
      d="M 70 144 C 60 108 62 74 74 58 C 88 42 152 42 166 58 C 178 74 180 108 170 144 C 166 154 156 154 150 146 L 90 146 C 84 154 74 154 70 144 Z"
      fill={hex} />;

    front =
    <>
        <path
        d="M 74 86 C 72 46 96 44 120 44 C 144 44 168 46 166 86 C 156 62 138 59 120 59 C 100 59 84 64 74 86 Z"
        fill={hex} />

        <path
        d="M 104 60 C 122 56 138 58 148 66"
        stroke={shade}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.45} />

        {/* side braid falling beside the head, over the shoulder */}
        <g className={swayBig}>
          <path d="M 160 100 C 170 102 176 110 177 118 L 164 122 Z" fill={hex} />
          <ellipse cx={172} cy={121} rx={9.2} ry={7.6} fill={hex} transform="rotate(18 172 121)" />
          <ellipse cx={178} cy={136} rx={8.6} ry={7} fill={hex} transform="rotate(-16 178 136)" />
          <ellipse cx={172} cy={151} rx={8} ry={6.6} fill={hex} transform="rotate(16 172 151)" />
          <ellipse cx={178} cy={165} rx={7.2} ry={6} fill={hex} transform="rotate(-14 178 165)" />
          <ellipse cx={174} cy={178} rx={6.4} ry={5.4} fill={hex} transform="rotate(10 174 178)" />
          <ellipse cx={176} cy={187} rx={4.2} ry={3} fill={shade} />
          <path d="M 173 190 C 170 198 172 204 176 207 C 179 201 179 194 177 190 Z" fill={hex} />
        </g>
      </>;

  } else if (style === 'highpony') {
    back =
    <g className={swayBig}>
        <path
        d="M 118 36 C 112 18 130 12 146 17 C 168 24 178 46 172 70 C 168 84 156 82 158 68 C 160 50 152 34 138 29 C 128 26 121 30 121 36 Z"
        fill={hex} />

        <path
        d="M 172 70 C 174 80 170 88 162 90 C 164 82 164 74 163 68 Z"
        fill={hex} />

        <ellipse cx={117} cy={38} rx={6} ry={4.4} fill={shade} transform="rotate(-18 117 38)" />
      </g>;

    front =
    <path
      d="M 74 86 C 72 46 96 40 120 40 C 144 40 168 46 166 86 C 158 60 138 56 120 56 C 100 56 82 62 74 86 Z"
      fill={hex} />;

  } else if (style === 'pixie') {
    front =
    <>
        <path
        d="M 74 92 C 68 48 96 40 122 41 C 150 42 170 52 166 88 C 162 96 153 92 151 83 C 149 70 141 62 131 60 C 115 70 96 74 84 76 C 78 80 75 86 74 92 Z"
        fill={hex} />

        <path d="M 73 92 C 70 102 72 112 79 118 C 82 109 80 99 78 93 Z" fill={hex} />
        <path d="M 167 88 C 170 98 168 108 161 114 C 158 105 160 96 162 90 Z" fill={hex} />
      </>;

  }

  return {
    back,
    front: front ? <g className={sway}>{front}</g> : null
  };
}

// ── Headwear ─────────────────────────────────────────────
function Headwear({ ctx }: {ctx: Ctx;}) {
  const style = ctx.config.headwear;
  if (style === 'none') return null;
  const { hex, shade } = ctx.hatC;

  if (style === 'cap') {
    return (
      <>
        <path d="M 78 66 Q 78 33 120 33 Q 162 33 162 66 L 162 68 L 78 68 Z" fill={hex} />
        <path d="M 120 33 L 120 68" stroke={shade} strokeWidth={1.6} opacity={0.4} />
        <circle cx={120} cy={34} r={3.4} fill={shade} />
        <rect x={70} y={64} width={100} height={11} rx={5.5} fill={shade} />
      </>);

  }
  if (style === 'beanie') {
    return (
      <>
        <path d="M 77 74 Q 77 31 120 31 Q 163 31 163 74 Z" fill={hex} />
        <path d="M 96 37 Q 108 33 120 33" stroke="#FFFFFF" strokeWidth={2} opacity={0.22} strokeLinecap="round" fill="none" />
        <rect x={74} y={62} width={92} height={15} rx={7.5} fill={shade} />
      </>);

  }
  if (style === 'bucket') {
    return (
      <>
        <path d="M 84 62 Q 84 32 120 32 Q 156 32 156 62 Z" fill={hex} />
        <path d="M 84 56 L 156 56" stroke={shade} strokeWidth={2.4} opacity={0.6} />
        <path d="M 84 56 L 78 60 Q 66 64 64 72 Q 120 84 176 72 Q 174 64 162 60 L 156 56 Z" fill={hex} />
        <path d="M 64 72 Q 120 84 176 72" stroke={shade} strokeWidth={2.4} opacity={0.5} fill="none" />
      </>);

  }
  if (style === 'pom') {
    return (
      <>
        <circle cx={120} cy={26} r={9} fill={POM_CREAM} />
        <path d="M 78 74 Q 78 32 120 32 Q 162 32 162 74 Z" fill={hex} />
        <rect x={75} y={63} width={90} height={14} rx={7} fill={shade} />
      </>);

  }
  if (style === 'headphones') {
    return (
      <>
        <path
          d="M 76 62 Q 76 24 120 24 Q 164 24 164 62"
          stroke={hex}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none" />

        <rect x={62} y={90} width={19} height={32} rx={8.5} fill={hex} />
        <rect x={159} y={90} width={19} height={32} rx={8.5} fill={hex} />
        <rect x={66.5} y={95} width={10} height={22} rx={5} fill={shade} />
        <rect x={163.5} y={95} width={10} height={22} rx={5} fill={shade} />
      </>);

  }
  // crown
  return (
    <>
      <path
        d="M 93 63 L 93 42 L 105 51 L 120 33 L 135 51 L 147 42 L 147 63 Q 120 70 93 63 Z"
        fill={hex} />

      <circle cx={93} cy={39} r={3.2} fill={hex} />
      <circle cx={120} cy={30} r={3.2} fill={hex} />
      <circle cx={147} cy={39} r={3.2} fill={hex} />
      <circle cx={106} cy={58} r={2.4} fill={shade} />
      <circle cx={120} cy={60} r={2.4} fill={shade} />
      <circle cx={134} cy={58} r={2.4} fill={shade} />
    </>);

}

// ── Hijab ────────────────────────────────────────────────
/**
 * The hijab is built as wrapped fabric, not a hood:
 *  1. a snug head wrap hugging the skull (evenodd face opening that frames
 *     the forehead, curves around the cheeks and passes UNDER the chin);
 *  2. an under-chin fold (darker crescent) where the wrap crosses itself;
 *  3. crown fold lines and a soft highlight — stylized fabric;
 *  4. a separate chest drape with an organic curved hem (HijabDrape).
 * The opening mirrors the girl head curve, so the face sits embedded in
 * fabric and can never clip it.
 */

/** Standard face opening — forehead, cheeks, then fabric under the chin. */
const HIJAB_OPEN =
'M 120 78 C 138 78 152 90 153 107 C 154 125 140 140 120 141 C 100 140 86 125 87 107 C 88 90 102 78 120 78 Z';
/** Relaxed opening for the everyday style — leaves room for a fringe. */
const HIJAB_OPEN_RELAX =
'M 120 73 C 139 73 153 88 154 106 C 155 125 141 141 120 142 C 99 141 85 125 86 106 C 87 88 101 73 120 73 Z';

function UnderChinFold({ shade, small }: {shade: string;small?: boolean;}) {
  return (
    <path
      d={
      small ?
      'M 98 137 C 105 150 135 150 142 137 C 139 158 101 158 98 137 Z' :
      'M 94 136 C 102 152 138 152 146 136 C 143 162 97 162 94 136 Z'
      }
      fill={shade}
      opacity={0.45} />);


}

function CrownFolds({ shade }: {shade: string;}) {
  return (
    <g stroke={shade} strokeLinecap="round" fill="none">
      <path d="M 86 80 C 90 56 104 44 120 42" strokeWidth={2.2} opacity={0.4} />
      <path d="M 154 80 C 150 62 142 50 132 44" strokeWidth={2} opacity={0.28} />
    </g>);

}

function CrownHighlight() {
  return (
    <path
      d="M 96 52 C 106 43 134 43 144 52"
      stroke="#FFFFFF"
      strokeWidth={2.4}
      strokeLinecap="round"
      fill="none"
      opacity={0.2} />);


}

function HijabHead({ ctx }: {ctx: Ctx;}) {
  const style = ctx.config.hijab;
  if (!ctx.hijabOn) return null;
  const { hex, shade } = ctx.hijabC;

  if (style === 'wrapped') {
    // Turban wrap: banded volume above the brows, twisted knot in front.
    return (
      <>
        <path
          d="M 120 30 C 156 30 177 46 178 72 C 179 83 170 88 158 86 C 145 84 133 82 120 82 C 107 82 95 84 82 86 C 70 88 61 83 62 72 C 63 46 84 30 120 30 Z"
          fill={hex} />

        <path
          d="M 84 62 C 96 40 144 40 156 62 C 140 50 100 50 84 62 Z"
          fill={shade}
          opacity={0.35} />

        <ellipse cx={120} cy={37} rx={13} ry={8.5} fill={shade} opacity={0.85} />
        <path
          d="M 70 74 C 86 68 104 65 120 65"
          stroke={shade}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.4} />

      </>);

  }

  if (style === 'sport') {
    // Snug athletic wrap, minimal fabric.
    return (
      <>
        <path
          fillRule="evenodd"
          d={`M 120 42 C 149 42 167 62 169 92 C 170 110 163 126 152 136 C 143 144 132 148 120 148 C 108 148 97 144 88 136 C 77 126 70 110 71 92 C 73 62 91 42 120 42 Z ${HIJAB_OPEN}`}
          fill={hex} />

        <path d={HIJAB_OPEN} stroke={shade} strokeWidth={1.6} fill="none" opacity={0.3} />
        <UnderChinFold shade={shade} small />
        <path
          d="M 90 74 C 96 56 108 48 120 46"
          stroke={shade}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.35} />

      </>);

  }

  const relaxed = style === 'open';
  const outer = relaxed ?
  'M 120 36 C 155 36 176 60 178 96 C 179 116 171 134 158 144 C 148 153 134 157 120 157 C 106 157 92 153 82 144 C 69 134 61 116 62 96 C 64 60 85 36 120 36 Z' :
  'M 120 38 C 154 38 174 60 176 94 C 177 114 170 132 158 143 C 148 152 134 156 120 156 C 106 156 92 152 82 143 C 70 132 63 114 64 94 C 66 60 86 38 120 38 Z';

  return (
    <>
      <path
        fillRule="evenodd"
        d={`${outer} ${relaxed ? HIJAB_OPEN_RELAX : HIJAB_OPEN}`}
        fill={hex} />

      <path
        d={relaxed ? HIJAB_OPEN_RELAX : HIJAB_OPEN}
        stroke={shade}
        strokeWidth={1.6}
        fill="none"
        opacity={0.3} />

      {style === 'layered' &&
      <path
        d="M 88 102 C 89 85 103 76 120 76 C 137 76 151 85 152 102"
        stroke={shade}
        strokeWidth={4.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.85} />

      }
      {style === 'modern' && <circle cx={152} cy={100} r={2.6} fill={GOLD} />}
      <UnderChinFold shade={shade} />
      <CrownFolds shade={shade} />
      <CrownHighlight />
    </>);

}

/**
 * Chest drape — a separate fabric layer over the clothing with an organic
 * curved hem. Each style has its own silhouette (bell, stepped layers,
 * asymmetric sweep, casual round, tucked band).
 */
function HijabDrape({ ctx }: {ctx: Ctx;}) {
  const style = ctx.config.hijab;
  if (!ctx.hijabOn || style === 'wrapped') return null;
  const { hex, shade } = ctx.hijabC;

  if (style === 'sport') {
    return (
      <path
        d="M 98 180 C 94 162 104 150 120 150 C 136 150 146 162 142 180 C 134 189 106 189 98 180 Z"
        fill={hex} />);


  }

  if (style === 'modern') {
    // Elegant asymmetric sweep with a long layered tail.
    return (
      <>
        <path
          d="M 74 208 C 66 188 70 168 82 156 C 92 146 106 142 120 142 C 138 142 154 148 166 162 C 182 180 186 212 176 234 C 166 241 152 240 144 233 C 153 217 155 197 147 183 C 138 194 121 200 105 196 C 92 193 80 214 74 208 Z"
          fill={hex} />

        <path
          d="M 132 160 C 148 176 154 200 150 222"
          stroke={shade}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.35} />

      </>);

  }

  if (style === 'layered') {
    // Two visible tiers — fabric overlapping fabric.
    return (
      <>
        <path
          d="M 82 230 C 76 214 78 202 86 196 C 108 206 132 206 154 196 C 162 202 164 214 158 230 C 140 239 100 239 82 230 Z"
          fill={hex} />

        <path
          d="M 86 196 C 108 206 132 206 154 196"
          stroke={shade}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.5} />

        <path
          d="M 70 202 C 62 182 66 164 80 154 C 92 145 106 142 120 142 C 134 142 148 145 160 154 C 174 164 178 182 170 202 C 154 213 86 213 70 202 Z"
          fill={hex} />

        <path
          d="M 74 196 C 96 206 144 206 166 196"
          stroke={shade}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.35} />

      </>);

  }

  if (style === 'open') {
    return (
      <>
        <path
          d="M 78 202 C 70 184 74 166 86 156 C 96 147 107 144 120 144 C 133 144 144 147 154 156 C 166 166 170 184 162 202 C 146 213 94 213 78 202 Z"
          fill={hex} />

        <path
          d="M 120 156 C 118 172 118 188 121 204"
          stroke={shade}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
          opacity={0.3} />

      </>);

  }

  // classic — soft symmetric bell
  return (
    <>
      <path
        d="M 68 224 C 60 198 64 172 78 158 C 90 146 104 142 120 142 C 136 142 150 146 162 158 C 176 172 180 198 172 224 C 156 236 84 236 68 224 Z"
        fill={hex} />

      <path
        d="M 96 148 C 104 156 136 156 144 148"
        stroke={shade}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.35} />

      <path
        d="M 120 158 C 118 180 118 204 122 228"
        stroke={shade}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.3} />

    </>);

}

// ── Clothing ─────────────────────────────────────────────
const TORSO = 'M 54 240 L 54 206 Q 54 172 90 170 L 150 170 Q 186 172 186 206 L 186 240 Z';

function Clothing({ ctx }: {ctx: Ctx;}) {
  const style = ctx.config.clothing;
  const { hex, shade } = ctx.clothC;
  const skin = ctx.skin;

  const neck =
  <>
      <rect x={107.5} y={126} width={25} height={48} rx={9} fill={skin.hex} />
      <rect x={107.5} y={144} width={25} height={9} rx={4.5} fill={skin.shade} opacity={0.55} />
    </>;


  if (style === 'hoodie') {
    return (
      <>
        <path
          d="M 82 172 Q 70 148 94 138 Q 106 132 120 134 Q 134 132 146 138 Q 170 148 158 172 Q 138 162 120 164 Q 102 162 82 172 Z"
          fill={shade} />

        {neck}
        <path d={TORSO} fill={hex} />
        <path d="M 100 170 Q 120 188 140 170 L 145 178 Q 120 198 95 178 Z" fill={shade} opacity={0.55} />
        <path d="M 111 182 L 110 202" stroke={POM_CREAM} strokeWidth={2.6} strokeLinecap="round" />
        <path d="M 129 182 L 130 202" stroke={POM_CREAM} strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={110} cy={204} r={2} fill={POM_CREAM} />
        <circle cx={130} cy={204} r={2} fill={POM_CREAM} />
        <path d="M 98 240 L 102 218 Q 120 212 138 218 L 142 240 Z" fill={shade} opacity={0.4} />
      </>);

  }
  if (style === 'shirt') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <path d="M 106 170 L 120 185 L 104 189 Z" fill={shade} />
        <path d="M 134 170 L 120 185 L 136 189 Z" fill={shade} />
        <path d="M 120 185 L 120 240" stroke={shade} strokeWidth={2} opacity={0.7} />
        <circle cx={120} cy={200} r={2} fill={shade} />
        <circle cx={120} cy={216} r={2} fill={shade} />
        <circle cx={120} cy={232} r={2} fill={shade} />
      </>);

  }
  if (style === 'jacket') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={JACKET_INNER} />
        <path d="M 54 240 L 54 206 Q 54 172 90 170 L 108 170 L 104 240 Z" fill={hex} />
        <path d="M 186 240 L 186 206 Q 186 172 150 170 L 132 170 L 136 240 Z" fill={hex} />
        <path d="M 108 170 L 116 184 L 102 196 L 104 176 Z" fill={shade} />
        <path d="M 132 170 L 124 184 L 138 196 L 136 176 Z" fill={shade} />
        <path d="M 120 178 L 120 236" stroke="#9AA0AB" strokeWidth={1.6} opacity={0.6} />
      </>);

  }
  if (style === 'sweater') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <rect x={101} y={165} width={38} height={13} rx={6.5} fill={shade} />
        <path d="M 108 167 L 108 176 M 114 166 L 114 177 M 120 166 L 120 177 M 126 166 L 126 177 M 132 167 L 132 176" stroke={hex} strokeWidth={1.4} opacity={0.5} />
        <rect x={54} y={230} width={132} height={10} fill={shade} opacity={0.45} />
      </>);

  }
  if (style === 'turtleneck') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <rect x={103} y={137} width={34} height={40} rx={11} fill={hex} />
        <path d="M 109 142 L 109 172 M 116 140 L 116 174 M 123 140 L 123 174 M 130 142 L 130 172" stroke={shade} strokeWidth={1.5} opacity={0.5} />
      </>);

  }
  if (style === 'sporty') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <path d="M 54 214 L 186 196 L 186 206 L 54 224 Z" fill="#FFFFFF" opacity={0.75} />
        <path d="M 54 228 L 186 210 L 186 214 L 54 232 Z" fill={shade} opacity={0.8} />
        <path d="M 103 171 Q 120 184 137 171" stroke={shade} strokeWidth={5} strokeLinecap="round" fill="none" />
      </>);

  }
  if (style === 'suit') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <path d="M 105 170 L 120 198 L 135 170 Q 120 179 105 170 Z" fill="#FFFFFF" />
        <path d="M 117.5 175 L 122.5 175 L 121 182 L 125.5 201 L 120 212 L 114.5 201 L 119 182 Z" fill={TIE_RED} />
        <path d="M 105 170 L 120 198 L 98 192 L 100 174 Z" fill={shade} />
        <path d="M 135 170 L 120 198 L 142 192 L 140 174 Z" fill={shade} />
      </>);

  }
  if (style === 'dress') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <circle cx={72} cy={182} r={13} fill={hex} />
        <circle cx={168} cy={182} r={13} fill={hex} />
        <path
          d="M 101 170 Q 120 187 139 170"
          stroke={shade}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none" />

        <path d="M 60 224 Q 120 236 180 224 L 180 232 Q 120 244 60 232 Z" fill={shade} opacity={0.5} />
        <path d="M 114 190 L 120 194 L 126 190 L 120 199 Z" fill={shade} />
        <circle cx={120} cy={192} r={2} fill={shade} />
      </>);

  }
  if (style === 'blouse') {
    return (
      <>
        {neck}
        <path d={TORSO} fill={hex} />
        <path d="M 100 172 Q 102 186 118 188 Q 108 176 108 168 Z" fill="#FFFFFF" />
        <path d="M 140 172 Q 138 186 122 188 Q 132 176 132 168 Z" fill="#FFFFFF" />
        <path d="M 120 190 L 120 240" stroke={shade} strokeWidth={1.8} opacity={0.6} />
        <circle cx={120} cy={202} r={2} fill={shade} />
        <circle cx={120} cy={218} r={2} fill={shade} />
        <circle cx={120} cy={234} r={2} fill={shade} />
      </>);

  }
  // tee
  return (
    <>
      {neck}
      <path d={TORSO} fill={hex} />
      <path
        d="M 103 170 Q 120 184 137 170"
        stroke={shade}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none" />

    </>);

}

// ── Accessories ──────────────────────────────────────────
function FaceAccessories({ ctx }: {ctx: Ctx;}) {
  const acc = ctx.config.accessories;
  const girl = ctx.config.gender === 'girl';
  const halfW = ctx.geo.w / 2;
  const earY = 148 - ctx.geo.h * 0.44;
  const smiling = ctx.pose.mood === 'smile';
  // Girls carry a whisper of blush by default; the accessory strengthens it.
  const blushOpacity = acc.includes('blush') ?
  0.34 :
  smiling ?
  0.28 :
  girl ?
  0.16 :
  0;
  return (
    <>
      {blushOpacity > 0 &&
      <g style={{ opacity: blushOpacity, transition: 'opacity 220ms ease-out' }}>
          <ellipse cx={97} cy={119} rx={6.6} ry={3.8} fill={BLUSH_PINK} />
          <ellipse cx={143} cy={119} rx={6.6} ry={3.8} fill={BLUSH_PINK} />
        </g>
      }
      {acc.includes('freckles') &&
      <g fill={ctx.skin.shade} opacity={0.75}>
          <circle cx={96} cy={116.5} r={1.5} />
          <circle cx={102.5} cy={119.5} r={1.5} />
          <circle cx={109} cy={116.5} r={1.5} />
          <circle cx={131} cy={116.5} r={1.5} />
          <circle cx={137.5} cy={119.5} r={1.5} />
          <circle cx={144} cy={116.5} r={1.5} />
        </g>
      }
      {acc.includes('earrings') &&
      <g fill={GOLD}>
          <circle cx={120 - halfW - 1} cy={earY + 7.5} r={3} />
          <circle cx={120 + halfW + 1} cy={earY + 7.5} r={3} />
        </g>
      }
    </>);

}

function Eyewear({ ctx }: {ctx: Ctx;}) {
  const acc = ctx.config.accessories;
  const halfW = ctx.geo.w / 2;
  if (acc.includes('glasses')) {
    return (
      <g>
        <path d={`M ${120 - halfW + 1} 99 L 87 103`} stroke={FRAME} strokeWidth={2.6} strokeLinecap="round" />
        <path d={`M ${120 + halfW - 1} 99 L 153 103`} stroke={FRAME} strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={100} cy={104} r={13} fill="#FFFFFF" fillOpacity={0.14} stroke={FRAME} strokeWidth={3} />
        <circle cx={140} cy={104} r={13} fill="#FFFFFF" fillOpacity={0.14} stroke={FRAME} strokeWidth={3} />
        <path d="M 113 102 Q 120 98 127 102" stroke={FRAME} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      </g>);

  }
  if (acc.includes('sunglasses')) {
    return (
      <g>
        <path d={`M ${120 - halfW + 1} 98 L 88 100`} stroke={LENS} strokeWidth={2.8} strokeLinecap="round" />
        <path d={`M ${120 + halfW - 1} 98 L 152 100`} stroke={LENS} strokeWidth={2.8} strokeLinecap="round" />
        <rect x={86} y={94} width={28} height={20} rx={9} fill={LENS} />
        <rect x={126} y={94} width={28} height={20} rx={9} fill={LENS} />
        <path d="M 114 99 Q 120 96 126 99" stroke={LENS} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M 93 99 L 103 109" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.3} strokeLinecap="round" />
        <path d="M 133 99 L 143 109" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.3} strokeLinecap="round" />
      </g>);

  }
  return null;
}

// ── Root ─────────────────────────────────────────────────
export const AvatarRig = React.memo(function AvatarRig({
  config,
  pose = NEUTRAL_POSE,
  crop = 'bust',
  idleMotion = false,
  className,
  label
}: AvatarRigProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const skin = getSkin(config.skin);
  const hairC = getHairColor(config.hairColor);
  const hatC = getHeadwearColor(config.headwearColor);
  const hijabC = getHijabColor(config.hijabColor);
  const clothC = getClothingColor(config.clothingColor);
  const bg = getBackground(config.background);
  const geo = FACE_GEOMETRY[config.face] ?? FACE_GEOMETRY.soft;
  const hijabOn = config.gender === 'girl' && config.hijab !== 'none';

  const ctx: Ctx = { uid, config, pose, skin, hairC, hatC, hijabC, clothC, geo, idleMotion, hijabOn };

  // A covering hat flattens voluminous hair so nothing clips through it.
  // A hijab replaces hair rendering entirely (coverage is config-driven).
  const effectiveHair =
  COVERING_HEADWEAR.has(config.headwear) ?
  HAIR_UNDER_HAT[config.hair] ?? config.hair :
  config.hair;
  const hair = hijabOn ?
  { back: null, front: null } :
  hairPaths(effectiveHair, hairC.hex, hairC.shade, idleMotion);
  const showFringe = hijabOn && getHijabStyle(config.hijab)?.fringe === true;

  const halfW = geo.w / 2;
  const earY = 148 - geo.h * 0.44;
  const headScale = `translate(120 148) scale(${(geo.w / 94).toFixed(4)} ${(
  geo.h / 98).
  toFixed(4)}) translate(-120 -148)`;

  return (
    <svg
      viewBox={crop === 'face' ? '50 12 140 140' : '0 0 240 240'}
      className={className}
      role="img"
      aria-label={label}
      aria-hidden={label ? undefined : true}>

      <rect x={0} y={0} width={240} height={240} fill={bg.hex} />
      {crop === 'bust' &&
      <ellipse cx={120} cy={226} rx={78} ry={14} fill={bg.shade} opacity={0.5} />
      }

      {/* hop (reactions) */}
      <g
        style={{
          transform: pose.lift ? 'translateY(-6px)' : 'translateY(0px)',
          transition: `transform 300ms ${EASE_SPRING}`
        }}>

        {/* breathing */}
        <g className={idleMotion ? 'av-breathe' : undefined}>
          <Clothing ctx={ctx} />
          {config.accessories.includes('necklace') &&
          <>
              <path
              d="M 100 172 Q 120 194 140 172"
              stroke={GOLD}
              strokeWidth={2.4}
              fill="none" />

              <circle cx={120} cy={190} r={4} fill={GOLD} />
              <circle cx={118.6} cy={188.4} r={1.2} fill="#FFF7E0" />
            </>
          }
          <HijabDrape ctx={ctx} />

          {/* head — tilts as one unit */}
          <g
            style={{
              transform: `rotate(${pose.tilt}deg)`,
              transformOrigin: '120px 150px',
              transformBox: 'view-box',
              transition: `transform 460ms ${EASE_SPRING}`
            }}>

            {hair.back && <g transform={headScale}>{hair.back}</g>}

            <circle cx={120 - halfW} cy={earY} r={8.5} fill={skin.hex} />
            <circle cx={120 + halfW} cy={earY} r={8.5} fill={skin.hex} />
            <circle cx={120 - halfW - 1.5} cy={earY} r={3.4} fill={skin.shade} opacity={0.6} />
            <circle cx={120 + halfW + 1.5} cy={earY} r={3.4} fill={skin.shade} opacity={0.6} />

            {config.gender === 'girl' ?
            <path
              d={girlHeadPath(geo.w, geo.h, GIRL_CHIN[config.face] ?? 0.5)}
              fill={skin.hex} /> :

            <rect
              x={120 - halfW}
              y={148 - geo.h}
              width={geo.w}
              height={geo.h}
              rx={geo.r}
              fill={skin.hex} />
            }


            <FaceAccessories ctx={ctx} />

            {/* brows — lift as a pair */}
            <g
              style={{
                transform: `translateY(${pose.browLift ? -3 : 0}px)`,
                transition: `transform 220ms ${EASE_SOFT}`
              }}>

              <BrowSide ctx={ctx} side={-1} />
              <BrowSide ctx={ctx} side={1} />
            </g>

            <EyeSide ctx={ctx} side={-1} />
            <EyeSide ctx={ctx} side={1} />

            <path
              d="M 114.5 115 Q 120 121 125.5 115"
              stroke={skin.shade}
              strokeWidth={3.2}
              strokeLinecap="round"
              fill="none" />


            <Mouth ctx={ctx} />

            <Eyewear ctx={ctx} />

            {hair.front && <g transform={headScale}>{hair.front}</g>}

            {showFringe &&
            <g transform={headScale}>
                <path
                d="M 99 83 C 103 60 112 54 120 54 C 128 54 137 60 141 83 C 136 74 130 78 125 75 C 122 78 118 78 115 75 C 110 78 104 74 99 83 Z"
                fill={hairC.hex} />

              </g>
            }

            <g transform={headScale}>
              <Headwear ctx={ctx} />
              <HijabHead ctx={ctx} />
            </g>
          </g>
        </g>
      </g>
    </svg>);

});
