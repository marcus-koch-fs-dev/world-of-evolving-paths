export type PointKind = 'start' | 'milestone' | 'crossroad' | 'goal';
export type PointStatus = 'done' | 'current' | 'open' | 'abandoned';

export type Position = { x: number; y: number };

export type PathPoint = {
  id: string;
  pathId: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  title: string;
  kind: PointKind;
  status: PointStatus;
  /** Ids of the points this point leads to. Two or more make it a fork. */
  next: string[];
  /** 1 (default) to 5. Bigger points keep more distance. */
  importance?: number;
  note?: string;
  /** Strength tier of the segment leading to this point, 0 to 4. See `TIERS`. */
  strength?: number;
  /** Pins the point at this position. Both `x` and `y` must be set. Without them the layout places the point. */
  x?: number;
  y?: number;
};

export type Path = {
  id: string;
  name: string;
  /** `#rrggbb` */
  color: string;
  /** Paths are stacked by `lane`, lowest first. Defaults to the order in the list. */
  lane?: number;
};

/** Everything the library needs to draw one period (one view). */
export type PeriodData = {
  paths: Path[];
  points: PathPoint[];
};

/** Period key → period data. The key is made by `periodOf(...).key`. */
export type PeriodMap = Record<string, PeriodData>;

export type PlacedPoint = Omit<PathPoint, 'x' | 'y'> & Position;

export type PlacedWorld = {
  today: string;
  paths: Path[];
  points: PlacedPoint[];
};
