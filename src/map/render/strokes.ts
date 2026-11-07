import type { Graphics } from 'pixi.js';
import { dashSegments } from '../../core/scene/curves';
import type { Dash } from '../../core/scene/types';
import type { Position } from '../../core/types';

/** Flat list of coordinates, as Pixi polygons want them. */
export const flat = (points: Position[]) => points.flatMap((point) => [point.x, point.y]);

/** Strokes a polyline in one color. */
export function strokeLine(g: Graphics, points: Position[], width: number, color: string, alpha: number): void {
  if (points.length < 2) return;
  g.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => {
    g.lineTo(point.x, point.y);
  });
  g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
}

/** Strokes a polyline as dashes. `shift` moves the pattern along the line. */
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
  segments.forEach(([a, b]) => {
    g.moveTo(a.x, a.y).lineTo(b.x, b.y);
  });
  g.stroke({ width, color, alpha, cap: 'round' });
}
