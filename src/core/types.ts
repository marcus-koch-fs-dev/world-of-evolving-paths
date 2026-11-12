/**
 * The title and the date of a point that is not in the shown view, and its id if the app wants to go there (see
 * `onLeadDoubleClick`). A line that crosses the border of the view leads to such a point.
 */
export type Lead = { title: string; date: string; id?: string };

export type PointKind = 'start' | 'milestone' | 'crossroad' | 'goal';
export type PointStatus = 'done' | 'current' | 'open' | 'abandoned';

export type Position = { x: number; y: number };

/** How a path looks, without its points. */
export type PathInfo = {
  id: string;
  name: string;
  /** `#rrggbb`. A path keeps one color. */
  color: string;
  /** Paths are stacked by `lane`, lowest first. Defaults to the order in the list. */
  lane?: number;
};

/** A point of the shown view with its place on the map, as the scene works with it. */
export type PlacedPoint = Position & {
  id: string;
  pathId: string;
  branchId: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  title: string;
  kind: PointKind;
  status: PointStatus;
  /** The prio of the point, 1 to 5. Bigger points are drawn larger. */
  importance: number;
  note?: string;
  /** Strength tier of the line that arrives at the point, 0 to 4. See `TIERS`. */
  strength?: number;
  /** The points this point is connected to: the next one in its branch, and the first one of a branch that forks off. */
  next: string[];
};

/**
 * The place where the line of a branch crosses the border of the view, next to a point that is in the view. `pointId`
 * is that point. `far` is the point out there the line comes from (`before`) or goes to (`after`).
 */
export type PlacedArrow = Position & {
  /** The key of the border crossing, the same one the period on the other side of the border has. */
  key: string;
  pathId: string;
  side: 'before' | 'after';
  pointId: string;
  far: Lead;
};

/** A line across the whole view with no point in it: its two arrows, one on each border, and the points at its ends. */
export type PlacedSpan = {
  pathId: string;
  branchId: string;
  before: Position & { key: string };
  after: Position & { key: string };
  from: Lead;
  to: Lead;
  /** Strength tier of the line, 0 to 4. */
  strength?: number;
};

export type PlacedWorld = {
  today: string;
  /** The days the view covers, or null for the overview of everything. Today is only marked when it lies inside. */
  period?: { start: number; end: number } | null;
  paths: PathInfo[];
  points: PlacedPoint[];
  arrows: PlacedArrow[];
  spans: PlacedSpan[];
};
