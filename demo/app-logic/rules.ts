import type { PathPoint } from 'world-of-evolving-paths';

/** A point can be completed once every point that leads to it is done. */
export function canComplete(points: PathPoint[], id: string): boolean {
  return points.filter((point) => point.next.includes(id)).every((point) => point.status === 'done');
}
