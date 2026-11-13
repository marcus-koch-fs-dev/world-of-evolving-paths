// Keys in a text field or in an open dialog belong to it
const TEXT_INPUT = 'input, textarea, select, [contenteditable], dialog';

export type UndoShortcut = 'undo' | 'redo';

type KeyPress = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'target'>;

/**
 * The undo shortcut a key press stands for, or null: Ctrl+Z (Cmd+Z) undoes, Ctrl+Y or Ctrl+Shift+Z redoes.
 * In a text field the key press belongs to the field.
 */
export function undoShortcutFor(event: KeyPress): UndoShortcut | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return null;
  if (event.target instanceof Element && event.target.closest(TEXT_INPUT)) return null;
  const key = event.key.toLowerCase();
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
  if (key === 'y') return 'redo';
  return null;
}
