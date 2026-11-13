/** The accent color of the controls: what is switched on, selected or lit. */
export const DEFAULT_ACCENT = '#d4f25a';

/** Ready-made accent colors. The last ones are calmer, for eyes that tire of a bright green. */
export const ACCENTS: readonly { id: string; label: string; color: string }[] = [
  { id: 'lime', label: 'Lime', color: DEFAULT_ACCENT },
  { id: 'borg', label: 'Borg green', color: '#39ff14' },
  { id: 'alien', label: 'Alien green', color: '#4fe3a0' },
  { id: 'pink', label: 'Glowing pink', color: '#ff4fd8' },
  { id: 'ice', label: 'Ice blue', color: '#7cc7ff' },
  { id: 'sage', label: 'Soft sage', color: '#a9c58a' },
];

const HEX = /^#[0-9a-f]{6}$/i;

/** A stored color, or the default when it is not a `#rrggbb` color. */
export const accentFrom = (stored: unknown): string =>
  typeof stored === 'string' && HEX.test(stored) ? stored.toLowerCase() : DEFAULT_ACCENT;

/** Is the color one of the ready-made ones? Otherwise it is the user's own. */
export const isReadyMade = (color: string): boolean => ACCENTS.some((accent) => accent.color === color.toLowerCase());
