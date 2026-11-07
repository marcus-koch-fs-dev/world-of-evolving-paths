export type PointKind = 'start' | 'milestone' | 'crossroad' | 'goal';
export type PointStatus = 'done' | 'current' | 'open' | 'abandoned';

export type Position = { x: number; y: number };

export type PathPoint = {
  id: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  title: string;
  kind: PointKind;
  status: PointStatus;
  /** Ids of the points this point leads to. Two or more make it a fork. */
  next: string[];
  /** 1 (default) to 5. Bigger points are drawn larger and keep more distance. */
  importance?: number;
  note?: string;
  /** Strength tier of the segment leading to this point, 0 to 4. See `TIERS`. */
  strength?: number;
  /** Pins the point at this position. Both `x` and `y` must be set. Without them the layout places the point. */
  x?: number;
  y?: number;
};

/** How a path looks, without its points. */
export type PathInfo = {
  id: string;
  name: string;
  /** `#rrggbb`. A path keeps one color. */
  color: string;
  /** Paths are stacked by `lane`, lowest first. Defaults to the order in the list. */
  lane?: number;
};

export type Path = PathInfo & { points: PathPoint[] };

/** Everything the library needs to draw one period (one view): its paths, each with its points. */
export type PeriodData = { paths: Path[] };

/** Period key → period data. The key is made by `periodOf(...).key`. */
export type PeriodMap = Record<string, PeriodData>;

/** A point together with the path it belongs to, as the layout and the scene work with it. */
export type FlatPoint = PathPoint & { pathId: string };

export type PlacedPoint = Omit<FlatPoint, 'x' | 'y'> & Position;

export type PlacedWorld = {
  today: string;
  paths: PathInfo[];
  points: PlacedPoint[];
};
