import type { PathPoint, Position } from './types';

export type Shape = 'circle' | 'diamond' | 'square' | 'triangle' | 'star';

const CIRCLE_SEGMENTS = 64;
const STAR_SPIKES = 5;
const STAR_INNER_RATIO = 0.5;
const SQUARE_RATIO = 0.86;
const TOP = -90; // degrees, 0 = right

/** Shape by function: start ▲, goal ★, fork (more than one way on) ◆, otherwise ●. */
export function shapeOf(point: Pick<PathPoint, 'kind' | 'next'>): Shape {
  if (point.kind === 'start') return 'triangle';
  if (point.kind === 'goal') return 'star';
  if (point.kind === 'crossroad' || point.next.length >= 2) return 'diamond';
  return 'circle';
}

function regularPolygon(corners: number, radius: number, startDegrees: number): Position[] {
  return Array.from({ length: corners }, (_, i) => {
    const angle = ((startDegrees + (360 / corners) * i) * Math.PI) / 180;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}

function star(radius: number): Position[] {
  return Array.from({ length: STAR_SPIKES * 2 }, (_, i) => {
    const r = i % 2 === 0 ? radius : radius * STAR_INNER_RATIO;
    const angle = ((TOP + (180 / STAR_SPIKES) * i) * Math.PI) / 180;
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
  });
}

/** Corner points of a shape around (0, 0). The circle is approximated finely. */
export function shapePoints(shape: Shape, radius: number): Position[] {
  switch (shape) {
    case 'circle':
      return regularPolygon(CIRCLE_SEGMENTS, radius, 0);
    case 'diamond':
      return regularPolygon(4, radius, TOP);
    case 'square':
      return regularPolygon(4, radius * SQUARE_RATIO, -45);
    case 'triangle':
      return regularPolygon(3, radius, TOP);
    case 'star':
      return star(radius);
  }
}
