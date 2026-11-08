/** A value with the values it had before and the ones it had before they were undone. */
export type History<T> = { past: readonly T[]; present: T; future: readonly T[] };

const LIMIT = 100; // how many steps can be undone

/** A history that starts at a value, with nothing to undo or redo. */
export const createHistory = <T>(present: T): History<T> => ({ past: [], present, future: [] });

export const canUndo = <T>(history: History<T>) => history.past.length > 0;
export const canRedo = <T>(history: History<T>) => history.future.length > 0;

/** A new value becomes the present. The old one can be undone, what could be redone is gone. The same value changes nothing. */
export function record<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-LIMIT), present: next, future: [] };
}

/** Goes one step back. Without a step to go back to it changes nothing. */
export function undo<T>(history: History<T>): History<T> {
  if (!canUndo(history)) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past.at(-1) as T,
    future: [history.present, ...history.future],
  };
}

/** Goes one step forward again. Without a step to go forward to it changes nothing. */
export function redo<T>(history: History<T>): History<T> {
  if (!canRedo(history)) return history;
  const [next, ...rest] = history.future;
  return { past: [...history.past, history.present], present: next, future: rest };
}
