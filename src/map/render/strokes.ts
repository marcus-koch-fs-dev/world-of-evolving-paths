import type { Graphics } from 'pixi.js';
import { dashSegments } from '../../core/scene/curves';
import type { Dash } from '../../core/scene/types';
import type { Position } from '../../core/types';

/** Flat list of coordinates, as Pixi polygons want them. */
export const flat = (points: Position[]) => points.flatMap((point) => [point.x, point.y]);

export function strokeLine(g: Graphics, points: Position[], width: number, color: string, alpha: number): void {
  if (points.length < 2) return;
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
  g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
}

export function strokeDashes(
  g: Graphics,
  points: Position[],
  dash: Dash,
  shift: number,
  width: number,
  color: string,
  alpha: number,
): void {
  const segments = dashSegments(points, dash, shift);
  if (segments.length === 0) return;
  for (const [a, b] of segments) g.moveTo(a.x, a.y).lineTo(b.x, b.y);
  g.stroke({ width, color, alpha, cap: 'round' });
}
