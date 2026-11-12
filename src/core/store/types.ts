import type { ViewLevel } from '../calendar.js';
import type { PointKind, PointStatus, Position } from '../types.js';

/** The levels of the tower. Each one shows the points that are important enough for it. */
export type Level = ViewLevel;

/** A point of a branch, as the app enters it. */
export type StorePoint = {
  id: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  title: string;
  kind: PointKind;
  status: PointStatus;
  /** 1 (least) to 5 (most important). A week shows 1 to 5, a month 3 to 5, a year only 5. */
  prio: number;
  note?: string;
  /** Strength tier of the line that arrives at the point, 0 to 4. The app may give it. */
  strength?: number;
};

/**
 * One line of a path. Its points stand in time order (the id decides at the same date). The line always connects a
 * point with the one before and the one after it. A branch with `splitsAt` forks off from that point of another branch.
 */
export type Branch = { id: string; splitsAt?: string; points: StorePoint[] };

export type StorePath = {
  id: string;
  name: string;
  /** `#rrggbb`. */
  color: string;
  /** Paths are stacked by `lane`, lowest first. Defaults to the order in the list. */
  lane?: number;
  branches: Branch[];
};

/**
 * The heights kept for one level, as a distance from the lane of the path. `points` by point id, `arrows` by the key of
 * a border crossing (see `arrowKey`).
 */
export type LevelHeights = { points: Record<string, number>; arrows: Record<string, number> };

/** Everything the app keeps: the paths, the heights per level, and the free positions of the overview. */
export type Store = {
  paths: StorePath[];
  heights: Record<Level, LevelHeights>;
  /** Positions in the free arrangement of the view "All". They never touch the levels. */
  free: Record<string, Position>;
};
