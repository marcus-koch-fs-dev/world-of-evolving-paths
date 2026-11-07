import type { Position } from '../../core/types.js';

const DURATION_MS = 250;

/** Moves from one position to another in a short ease-out. Returns a function that stops the movement. */
export function springBack(
  from: Position,
  to: Position,
  onFrame: (position: Position) => void,
  onDone: () => void,
): () => void {
  let frame = 0;
  const start = performance.now();
  const step = (time: number) => {
    const progress = Math.min(1, (time - start) / DURATION_MS);
    const eased = 1 - (1 - progress) * (1 - progress);
    onFrame({ x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased });
    if (progress < 1) frame = requestAnimationFrame(step);
    else onDone();
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
