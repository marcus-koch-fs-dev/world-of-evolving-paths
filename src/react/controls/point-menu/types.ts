import type { StorePoint } from '../../../core/index.js';

export type PointPatch = Partial<Pick<StorePoint, 'title' | 'status' | 'kind' | 'date' | 'prio' | 'note'>>;

export type NextPointInput = {
  title: string;
  date: string;
  /** Put the new point on a path of its own. */
  newPath: boolean;
  /** Color of the new path. Only meaningful with `newPath`. */
  color: string;
  /** Name of the new path. Only meaningful with `newPath`. Empty or missing: the app picks a name, for example the title. */
  pathName?: string;
};

export type TileId = 'status' | 'next' | 'connect' | 'kind' | 'color' | 'rename' | 'details' | 'remove';
