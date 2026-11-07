import type { PathPoint } from '../../../core/index.js';

export type PointPatch = Partial<Pick<PathPoint, 'title' | 'status' | 'kind' | 'date' | 'importance' | 'note'>>;

export type NextPointInput = {
  title: string;
  date: string;
  /** Put the new point on a path of its own. */
  newPath: boolean;
  /** Color of the new path. Only meaningful with `newPath`. */
  color: string;
};

export type TileId = 'status' | 'next' | 'connect' | 'kind' | 'color' | 'rename' | 'details' | 'remove';
