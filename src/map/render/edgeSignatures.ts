import type { EdgeDraw } from '../../core/scene/types.js';
import type { Position } from '../../core/types.js';

/** A signature that changes whenever a line looks different. The wave only changes the course, not the ends. */
export function lineSignature(edge: EdgeDraw): string {
  const first = edge.points[0];
  const last = edge.points.at(-1) as Position;
  const quarter = edge.points[Math.floor(edge.points.length / 4)];
  return `${first.x},${first.y},${quarter.x},${quarter.y},${last.x},${last.y}|${edge.color}|${edge.width}|${edge.alpha}|${edge.dash ?? ''}`;
}

/** A signature that changes whenever the walked part of a line or its glow looks different. */
export function litSignature(edge: EdgeDraw): string {
  const lit = edge.lit;
  // The tip moves as today moves along the line, even when the number of points stays the same
  const tip = lit?.points.at(-1);
  return `${lineSignature(edge)}|${lit?.points.length}|${tip?.x},${tip?.y}|${lit?.color}|${lit?.width}|${edge.glow}`;
}
