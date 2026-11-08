import { useEffect, useState } from 'react';
import { connectProblem } from '../app-logic/state';
import type { DemoPoint } from '../app-logic/types';

const HINT = 'Click the point to connect to. Click the background or press Escape to cancel.';

type Options = {
  points: DemoPoint[];
  /** The point whose menu is open, if it is in the current view. */
  selectedId: string | null;
  connect: (fromId: string, toId: string) => void;
  select: (id: string | null) => void;
  /** Where the hint and the problems are shown. */
  setNotice: (message: string | null) => void;
};

/** Connect mode: pick a point, then the point to connect it to. It ends on a click, on Escape and when the view changes. */
export function useConnectMode({ points, selectedId, connect, select, setNotice }: Options) {
  const [from, setFrom] = useState<string | null>(null);

  const stop = () => {
    setFrom(null);
    setNotice(null);
  };

  // Connecting ends when the point it started from is no longer selected (another view, deleted)
  const stale = from !== null && from !== selectedId;
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the staleness decides, not the identity of the callback
  useEffect(() => {
    if (stale) stop();
  }, [stale]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: stop only sets state, so it does not need to re-register the key listener
  useEffect(() => {
    if (from === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [from]);

  return {
    /** The point the connection starts from, or null when not connecting. */
    from,
    toggle(fromId: string) {
      if (from === fromId) return stop();
      setFrom(fromId);
      setNotice(HINT);
    },
    /** While connecting, the next point that is clicked is the target. Anything else selects as usual. */
    handleSelect(id: string | null) {
      if (from === null) return select(id);
      const problem = id === null ? null : connectProblem(points, from, id);
      if (id !== null && !problem) connect(from, id);
      setFrom(null);
      setNotice(problem);
      if (id === null) select(null);
    },
  };
}
