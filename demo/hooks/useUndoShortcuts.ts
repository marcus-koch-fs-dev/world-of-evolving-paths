import { useEffect } from 'react';
import { undoShortcutFor } from '../app-logic/undoShortcuts';

type Options = {
  /** Off while the map is read only. */
  enabled: boolean;
  undo: () => void;
  redo: () => void;
};

/** Ctrl+Z undoes, Ctrl+Y and Ctrl+Shift+Z redo. Works anywhere on the page except in text fields. */
export function useUndoShortcuts({ enabled, undo, redo }: Options): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      const shortcut = undoShortcutFor(event);
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut === 'undo') undo();
      else redo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, undo, redo]);
}
