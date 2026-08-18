import React, { useId } from 'react';

/**
 * Top-Down 3D Pushpin (📌) with Realistic 3D Paper Puncture Hole
 *
 * Modeled from steep top-down angle (~70°):
 *   • Realistic 3D paper puncture hole with torn paper highlight lip & inner depth shadow;
 *   • Steel pin needle tip plunging directly into the puncture opening;
 *   • Flared translucent ruby base skirt with ambient edge reflections;
 *   • Tapered cylindrical grip stem;
 *   • High-gloss spherical/button top head with crisp Apple-style glassy specular glints;
 *   • Soft directional drop shadow cast onto the card.
 */
export function NailHead({
  size = 32,
  className = '',
  style
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 54 54"
      width={size}
      height={size}
      className={['select-none pointer-events-none drop-shadow-xs', className].join(' ')}
      style={style}
      fill="none"
    >
      <defs>
        {/* Soft shadow filter */}
        <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" />
        </filter>

        {/* Puncture hole inner depth gradient */}
        <radialGradient id={`${id}-hole`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="70%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>

        {/* Steel needle gradient */}
        <linearGradient id={`${id}-needle`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="80%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Flared base skirt radial gradient */}
        <radialGradient id={`${id}-base`} cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff8a80" />
          <stop offset="25%" stopColor="#ff5252" />
          <stop offset="60%" stopColor="#e53935" />
          <stop offset="85%" stopColor="#c62828" />
          <stop offset="100%" stopColor="#7f0000" />
        </radialGradient>

        {/* Waist stem gradient */}
        <linearGradient id={`${id}-waist`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff867c" />
          <stop offset="35%" stopColor="#e53935" />
          <stop offset="70%" stopColor="#b71c1c" />
          <stop offset="100%" stopColor="#5f0000" />
        </linearGradient>

        {/* Top cap surface gradient */}
        <radialGradient id={`${id}-cap`} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ff9e80" />
          <stop offset="20%" stopColor="#ff5252" />
          <stop offset="55%" stopColor="#d32f2f" />
          <stop offset="85%" stopColor="#b71c1c" />
          <stop offset="100%" stopColor="#5f0909" />
        </radialGradient>

        {/* Top cap side bevel gradient */}
        <linearGradient id={`${id}-cap-side`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e53935" />
          <stop offset="60%" stopColor="#b71c1c" />
          <stop offset="100%" stopColor="#7f0000" />
        </linearGradient>
      </defs>

      {/* ── 1. Soft Realistic Cast Shadow ── */}
      <g filter={`url(#${id}-shadow)`} opacity="0.42">
        <ellipse cx="28" cy="32" rx="16" ry="9" fill="#090d16" />
      </g>

      {/* ── 2. 3D Paper Puncture Hole (Physical puncture into card) ── */}
      {/* Dark puncture incision cavity */}
      <ellipse
        cx="27"
        cy="33"
        rx="5.5"
        ry="2.8"
        fill={`url(#${id}-hole)`}
      />
      {/* Paper crease / shadow slit under the puncture */}
      <path
        d="M 20 34.5 Q 27 37 34 34.5"
        stroke="#0f172a"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Paper torn lip white highlight on upper rim */}
      <path
        d="M 21 32 Q 27 30.5 33 32"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* ── 3. Steel Needle Tip (Visible right above the puncture) ── */}
      <polygon
        points="25.5,33 28.5,33 27.5,27 26.5,27"
        fill={`url(#${id}-needle)`}
      />
      <line x1="26" y1="33" x2="27" y2="27" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />

      {/* ── 4. Flared Base Skirt ── */}
      <ellipse
        cx="27"
        cy="26"
        rx="14"
        ry="8.8"
        fill={`url(#${id}-base)`}
        stroke="#7f0000"
        strokeWidth="0.5"
      />
      {/* Base skirt top bevel highlight */}
      <ellipse
        cx="26.8"
        cy="25.2"
        rx="12.6"
        ry="7.4"
        fill="none"
        stroke="#ffcdd2"
        strokeWidth="0.8"
        opacity="0.75"
      />

      {/* ── 5. Tapered Waist Cylinder ── */}
      <path
        d="M 21.5 22 C 21.5 17.5, 22.5 14.5, 23.5 12.5 L 30.5 12.5 C 31.5 14.5, 32.5 17.5, 32.5 22 Z"
        fill={`url(#${id}-waist)`}
      />
      {/* Waist cylindrical specular reflection */}
      <path
        d="M 24.5 21 C 24.5 17.5, 25 14.5, 25.5 13"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* ── 6. Top Cap Side Bevel ── */}
      <path
        d="M 18 9 C 18 12.5, 36 12.5, 36 9 L 36 7.5 C 36 4, 18 4, 18 7.5 Z"
        fill={`url(#${id}-cap-side)`}
      />

      {/* ── 7. Top Cap Flat Disc (Seen from above) ── */}
      <ellipse
        cx="27"
        cy="8"
        rx="9.5"
        ry="5.5"
        fill={`url(#${id}-cap)`}
        stroke="#5f0000"
        strokeWidth="0.4"
      />

      {/* ── 8. Glassy Apple Specular Highlights ── */}
      {/* Soft broad highlight */}
      <ellipse
        cx="24"
        cy="6.5"
        rx="4.5"
        ry="2.3"
        transform="rotate(-15 24 6.5)"
        fill="#ffffff"
        opacity="0.75"
      />
      {/* Sharp star pinpoint glint */}
      <circle cx="23" cy="5.8" r="1.1" fill="#ffffff" />

      {/* Rim light on bottom edge of skirt */}
      <path
        d="M 19 28 C 22 30.5, 32 30.5, 35 28"
        fill="none"
        stroke="#ff8a80"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
