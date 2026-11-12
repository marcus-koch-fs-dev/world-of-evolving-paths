import type { Position } from '../../core/types.js';

/** A position with whole numbers, so the data the app stores stays tidy. */
export const rounded = (position: Position): Position => ({ x: Math.round(position.x), y: Math.round(position.y) });
