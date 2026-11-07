const TEXT_INPUT = 'input, textarea, select';

export type Shortcut = 'center' | 'fit';

/** The shortcut a key press stands for, or null. Presses with modifiers and presses in text fields do not count. */
export function shortcutFor(event: KeyboardEvent, enabled: boolean): Shortcut | null {
  if (!enabled || event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.target instanceof Element && event.target.closest(TEXT_INPUT)) return null;
  if (event.key === 'm' || event.key === 'M') return 'center';
  if (event.key === 'e' || event.key === 'E') return 'fit';
  return null;
}
