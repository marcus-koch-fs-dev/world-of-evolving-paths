import { useEffect, useRef } from 'react';
import { type ViewShortcut, viewShortcutFor } from '../app-logic/viewShortcuts';

/** Runs a view change for the keys W M Y, A, T, + and − and the left and right arrow. Not in text fields. */
export function useViewShortcuts(run: (shortcut: ViewShortcut) => void): void {
  // The newest `run` is kept in a ref, so the listener is set up once and not again on every render
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const shortcut = viewShortcutFor(event);
      if (!shortcut) return;
      event.preventDefault();
      latest.current(shortcut);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
