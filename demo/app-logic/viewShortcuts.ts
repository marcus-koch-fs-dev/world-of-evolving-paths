import type { ViewLevel } from 'world-of-evolving-paths';

// Keys in a text field or in an open dialog belong to it
const TEXT_INPUT = 'input, textarea, select, [contenteditable], dialog';

export type ViewShortcut =
  // The number of a view in the bar, counted from 1: the levels in the order of the bar, then everything
  | { type: 'view'; position: number }
  | { type: 'step'; count: -1 | 1 }
  | { type: 'years'; step: -1 | 1 }
  | { type: 'today' };

type KeyPress = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>;

/**
 * The view change a key press stands for, or null: the digits 1, 2, 3 ... pick the views in the order of the bar,
 * T goes to today, the left and right arrow move to the previous and next period, + and − change how many years the
 * year view spans. In a text field the key belongs to the field.
 */
export function viewShortcutFor(event: KeyPress): ViewShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.target instanceof Element && event.target.closest(TEXT_INPUT)) return null;
  if (event.key === 'ArrowLeft') return { type: 'step', count: -1 };
  if (event.key === 'ArrowRight') return { type: 'step', count: 1 };
  if (event.key === '+') return { type: 'years', step: 1 };
  if (event.key === '-') return { type: 'years', step: -1 };
  if (/^[1-9]$/.test(event.key)) return { type: 'view', position: Number(event.key) };
  return event.key.toLowerCase() === 't' ? { type: 'today' } : null;
}

/**
 * The view a number stands for: the levels the bar offers, in its order, then the overview (null). Undefined when the
 * number is beyond the last view.
 */
export function viewAtPosition(levels: readonly ViewLevel[], position: number): ViewLevel | null | undefined {
  const views: (ViewLevel | null)[] = [...levels, null];
  return views[position - 1];
}
