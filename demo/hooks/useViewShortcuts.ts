import { useEffect } from 'react';
import { type ViewShortcut, viewShortcutFor } from '../app-logic/viewShortcuts';

/** Runs a view change for the keys W M Y, A, T, + and − and the left and right arrow. Not in text fields. */
export function useViewShortcuts(run: (shortcut: ViewShortcut) => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const shortcut = viewShortcutFor(event);
      if (!shortcut) return;
      event.preventDefault();
      run(shortcut);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);
}
