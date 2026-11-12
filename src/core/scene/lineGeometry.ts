import type { PlacedPoint, PlacedWorld } from '../types.js';
import { viewEdges } from './viewEdges.js';

/** How far a line runs out of a point in a view without edges (a free view), along the time axis. */
export const LEAD_LENGTH = 220;
/** The least a line runs out of a point, also when the point is at or beyond the edge of the view. */
export const MIN_LEAD_LENGTH = 120;
/** Room between lines that leave on the same side of one point. */
export const LEAD_SPREAD = 44;
/** Room between two lines of one path that span the whole view. */
export const THROUGH_SPREAD = 60;
/** The least room between two lines that run side by side, so they do not lie on top of each other. */
export const LINE_GAP = 60;

export type LeadSide = 'before' | 'after';

/**
 * Where the line of a point ends along the time axis: at the edge of the view, so a path comes in from the left and
 * leaves to the right. A point close to that edge, or beyond it, keeps a short stretch so arrow and text stay visible.
 * Without a period (no edge) the line is a stretch of fixed length.
 */
export function leadEndX(world: PlacedWorld, point: PlacedPoint, side: LeadSide): number {
  const direction = side === 'before' ? -1 : 1;
  const edges = viewEdges(world);
  if (!edges) return point.x + direction * LEAD_LENGTH;
  return side === 'before'
    ? Math.min(edges.left, point.x - MIN_LEAD_LENGTH)
    : Math.max(edges.right, point.x + MIN_LEAD_LENGTH);
}

/**
 * Where the end of the line of a point would like to be in y, at the edge of the view: on the lane of its path, beside
 * the other lines on the same side of the point. The line then bends from there to the point, so a point that is
 * moved does not take its line along. Without a lane (a free view) it stays level with the point.
 */
export function leadBaseY(point: PlacedPoint, laneY: number | undefined, index: number, count: number): number {
  return (laneY ?? point.y) + (index - (count - 1) / 2) * LEAD_SPREAD;
}

/** The key of the end of a line that leaves a point, the same one the line has as a stand-in in the scene. */
export const leadKey = (side: LeadSide, pointId: string, index: number) => `lead:${side}:${pointId}:${index}`;

/** The key of a line that spans the whole view. */
export const throughKey = (pathId: string, index: number) => `through:${pathId}:${index}`;

/** The key of the whole line that spans the view, from the key of one of its ends. Null for any other key. */
export const throughKeyOfEnd = (endKey: string): string | null =>
  /^(through:.*:\d+):(?:start|end)$/.exec(endKey)?.[1] ?? null;

/** The id of the path of a line that spans the view, from the key of one of its ends. Null for any other key. */
export const throughPathIdOf = (endKey: string): string | null =>
  /^through:(.*):\d+:(?:start|end)$/.exec(endKey)?.[1] ?? null;

/** The key of one end of a line that spans the whole view: the arrow at the start or at the end of the view. */
export const throughEndKey = (pathId: string, index: number, side: LeadSide) =>
  `${throughKey(pathId, index)}:${side === 'before' ? 'start' : 'end'}`;
