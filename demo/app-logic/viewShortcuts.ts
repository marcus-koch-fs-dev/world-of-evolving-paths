import type { ViewLevel } from 'world-of-evolving-paths';

const TEXT_INPUT = 'input, textarea, select, [contenteditable]';

export type ViewShortcut =
  | { type: 'level'; level: ViewLevel }
  | { type: 'all' }
  | { type: 'step'; count: -1 | 1 }
  | { type: 'years'; step: -1 | 1 }
  | { type: 'today' };

type KeyPress = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>;

const LEVEL_KEYS: Record<string, ViewLevel> = { w: 'week', m: 'month', y: 'year' };

/**
 * The view change a key press stands for, or null: W M Y pick a level, A shows everything, T goes to today,
 * the left and right arrow move to the previous and next period, + and − change how many years the year view spans.
 * In a text field the key belongs to the field.
 */
export function viewShortcutFor(event: KeyPress): ViewShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.target instanceof Element && event.target.closest(TEXT_INPUT)) return null;
  if (event.key === 'ArrowLeft') return { type: 'step', count: -1 };
  if (event.key === 'ArrowRight') return { type: 'step', count: 1 };
  if (event.key === '+') return { type: 'years', step: 1 };
  if (event.key === '-') return { type: 'years', step: -1 };
  const key = event.key.toLowerCase();
  if (key === 't') return { type: 'today' };
  if (key === 'a') return { type: 'all' };
  const level = LEVEL_KEYS[key];
  return level ? { type: 'level', level } : null;
}
