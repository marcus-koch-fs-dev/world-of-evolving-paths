import type { Position } from './types.js';

/** The position moved to the nearest grid point. Without a usable `step` (off, zero, negative) it stays as it is. */
export function snapToGrid(position: Position, step: number | undefined): Position {
  if (step === undefined || !Number.isFinite(step) || step <= 0) return position;
  return { x: Math.round(position.x / step) * step, y: Math.round(position.y / step) * step };
}
