/**
 * "Clear Ledger" v2.0 palette — transcribed verbatim from the `:root` block of
 * reference/ClaimDesk_Mobile_v2.html.
 *
 * Light theme only. The prototype ships no dark palette; the token shape allows
 * one to be added later without touching consumers.
 */
export const color = {
  // surfaces
  paper: '#F2F4F8',
  paperRaised: '#FFFFFF',
  paperSunken: '#F5F7FA',

  // ink
  ink: '#101828',
  ink70: 'rgba(16,24,40,.72)',
  ink55: '#667085',
  ink40: '#98A2B3',
  ink25: '#C6CEDA',

  // lines
  line: '#EAECF2',
  lineMid: '#D5DBE4',

  // brand
  accent: '#2D5FF0',
  accentDeep: '#1E4AD1',
  accentTint: '#EBF0FE',
  onAccent: '#FFFFFF',
  focusRing: '#2D5FF0',

  // semantic
  ok: '#12A150',
  okTint: '#E7F6EE',
  warn: '#B25E09',
  warnTint: '#FCF2E3',
  danger: '#DE4444',
  dangerTint: '#FDEDED',
  /** Reserved for "smart-check" AI-insight cards. */
  violet: '#7A5AF8',
  violetTint: '#F1EEFE',
} as const;

/**
 * Hero gradient. Kept as structured stops rather than a CSS string so both
 * `linear-gradient()` (web) and `expo-linear-gradient` (native) can render it.
 */
export const gradient = {
  accent: {
    angleDeg: 135,
    stops: [
      { color: '#4B7BF7', position: 0 },
      { color: '#2D5FF0', position: 0.55 },
      { color: '#2049CE', position: 1 },
    ],
  },
} as const;

/** Avatar fills, hashed by name in the prototype. */
export const avatarPalette = [
  '#2D5FF0',
  '#7A5AF8',
  '#0FA47A',
  '#E0731D',
  '#D6456B',
  '#1193C2',
] as const;

export type ColorToken = keyof typeof color;
