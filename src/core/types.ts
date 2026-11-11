/**
 * A connection to a point that is not in the shown view: the title and the date of that point, and its id if the
 * app wants to go there (see `onLeadDoubleClick`).
 */
export type Lead = {
  title: string;
  date: string;
  id?: string;
  /**
   * The height where the line meets the edge of the view. Set it to keep a line where the user put it (see
   * `onLineEndMove`). Without it the line comes in on the lane of its path.
   */
  y?: number;
};

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
  /** Connections that come from points outside this view. The map draws a line towards the edge with title and date. */
  incoming?: Lead[];
  /** Connections that lead to points outside this view. The map draws a line towards the edge with title and date. */
  outgoing?: Lead[];
  /** 1 (default) to 5. Bigger points are drawn larger and keep more distance. */
  importance?: number;
  note?: string;
  /** Strength tier of the segment leading to this point, 0 to 4. See `TIERS`. */
  strength?: number;
  /**
   * Pins the point at this position. With only `y` the point keeps its height and sits on its date along the time
   * axis, for example a height the user chose that should hold in every view. `x` needs `y`. Without them the
   * layout places the point.
   */
  x?: number;
  y?: number;
};

/**
 * A connection that spans the whole period without a point in it: the point before and the point after.
 * The map draws a line across the view with an arrow and the title and date at each end.
 */
export type PathThrough = {
  from: Lead;
  to: Lead;
  /** Strength tier of the line, 0 to 4. See `TIERS`. */
  strength?: number;
  /** The height of the line across the view. Set it to keep a line where the user put it (see `onLineEndMove`). */
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
  /**
   * The connections of this path that span the whole period: from a point before it to a point after it, with no
   * point of theirs inside. A fork gives several. Each is drawn as a line across the view.
   */
  through?: PathThrough[];
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
  /** The days the view covers, or null for a free view. Today is only marked when it lies inside. */
  period?: { start: number; end: number } | null;
  paths: PathInfo[];
  points: PlacedPoint[];
};
