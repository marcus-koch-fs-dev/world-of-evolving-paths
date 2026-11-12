import type { StorePoint } from '../../../core/index.js';

export type PointPatch = Partial<Pick<StorePoint, 'title' | 'status' | 'kind' | 'date' | 'prio' | 'note'>>;

export type NextPointInput = {
  title: string;
  date: string;
  /** Start a new branch that forks off from the point, instead of adding to the branch the point is in. */
  newBranch: boolean;
};

export type TileId = 'status' | 'next' | 'kind' | 'color' | 'rename' | 'details' | 'remove';
