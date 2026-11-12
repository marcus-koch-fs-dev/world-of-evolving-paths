import type { BackgroundOptions, BackgroundPattern } from '../core/background/types.js';
import type { Camera } from '../core/camera.js';
import type { Direction } from '../core/orientation.js';
import type { LineEnd } from '../core/scene/lineTarget.js';
import type { PeriodMap, Position } from '../core/types.js';

export type { BackgroundOptions, BackgroundPattern };

// Which way time runs on the screen. `auto` is vertical while the map is taller than wide, otherwise horizontal.
export type Orientation = Direction | 'auto';

export type { LineEnd };

/** The end of a line, the arrow at the edge of the view, was dragged to a height. */
export type LineEndMoveEvent = {
  /** The two points the line leads from and to. Keep the height for this connection. */
  from: LineEnd;
  to: LineEnd;
  /**
   * What was moved. `end`: the user took the arrow at the end of the line, so only that end moves (its height is `y`).
   * `path`: the user took the line itself, so the whole path of the line moves in this view (see `shift`). While the
   * user drags, the preview shows the same. A line across the whole view has no path to take along, so it only gives `end`.
   */
  scope: 'end' | 'path';
  /** The id of the path of the line, when it is known. With scope `path` it is the path that moves. */
  pathId?: string;
  /**
   * With scope `end`: which end of the line was moved. `before` is the end at the start of the view, `after` the one at
   * its end. Needed for a line across the whole view, which has both.
   */
  side?: 'before' | 'after';
  /**
   * The height of the end of the line as a distance from the lane of the path of the line (0 = on the lane). With
   * scope `end` pass it back as `y` of the lead, or keep it yourself for the edge of the view.
   */
  y: number;
  /**
   * How far the pointer moved, up or down, since it took the line (negative: up when time runs left to right). With
   * scope `path`, add `shift` to the `offsets` of the points of the path in this view and pass the results back as `y`
   * of those points.
   */
  shift: number;
  /** The height from the lane of its path of every point of the view, by id, before the move. */
  offsets: Record<string, number>;
  /**
   * Every line that leaves the view or comes in from outside it (not the ones across the whole view), with the height of
   * its end at the edge, as a distance from the lane of its path, before the move. Add `shift` to the ends of the
   * lines of the path to move them along with its points.
   */
  lineEnds: LineEndHeight[];
};

/** The end of a line at the edge of the view: its two points and its height from the lane of its path. */
export type LineEndHeight = {
  from: LineEnd;
  to: LineEnd;
  y: number;
  /** Set for the ends of a line across the whole view: which border of the view the end lies on. */
  side?: 'before' | 'after';
};

export type PointMoveEvent = {
  id: string;
  x: number;
  y: number;
  /**
   * The height as a distance from the lane of the path of the point. Pass it back as `y` alone (without `x`) to keep
   * the point at this height in every view, on its date.
   */
  offset: number;
  /**
   * The height from the lane of its path of every point of the view, by id, as `offset` is for the moved point, as the
   * user sees them now. A point that is not pinned follows the point before it, so once you pass the new height of the
   * moved point back, the points after it move along. Pass back the `offsets` of those points too to leave them where
   * they are, so that a point moves alone.
   */
  offsets: Record<string, number>;
  /** Where every point of the view is right now. Pin them all to keep the layout exactly as the user sees it. */
  positions: Record<string, Position>;
};
export type PointAddEvent = {
  x: number;
  y: number;
  date: string;
  /** The y of the lane of every path in this view, by path id. `y` minus the lane of a path is the height to keep. */
  lanes: Record<string, number>;
};
export type PointDoubleClickEvent = { id: string; date: string };
/** A line that leaves the view was double-clicked: the point it leaves from, the side and what the app told about the point out there. */
export type LeadDoubleClickEvent = {
  pointId: string;
  side: 'before' | 'after';
  title: string;
  date: string;
  id?: string;
};

/** A line was clicked, or right-clicked: where, and the two points it leads from and to. */
export type LineSelectEvent = {
  /** The earlier end of the line. A point of the view, or the point out there when the line leaves the view. */
  from: LineEnd;
  /** The later end of the line. */
  to: LineEnd;
  /** Where on the line the user clicked, in the positions the data uses (see `PointAddEvent`), and the date there. */
  x: number;
  y: number;
  date: string;
  /** The y of the lane of every path in this view, by path id. `y` minus the lane of a path is the height to keep. */
  lanes: Record<string, number>;
  /** Where the click was on the map, in the coordinates of the overlay. A menu placed there moves with the camera. */
  at: Position;
};

export type PathWorldEvents = {
  /** A point was clicked (its id) or the empty area was clicked (null). */
  onSelect?: (id: string | null) => void;
  /**
   * A line was clicked or right-clicked: a connection between two points, a line that leaves the view, or one that
   * spans it. Your app decides what happens, for example a menu to insert a point there. Clicking the empty area
   * calls `onSelect(null)`, which is the time to close that menu.
   */
  onLineSelect?: (event: LineSelectEvent) => void;
  /**
   * The arrow at the end of a line that leaves the view or spans it was dragged up or down and let go. Store the
   * height and pass it back as `y` on the lead (or on the `through` of the path), so the line stays there.
   */
  onLineEndMove?: (event: LineEndMoveEvent) => void;
  /**
   * A dragged point was released. Pass `offset` back as `y` to keep its height in every view, or `x` and `y` to pin it
   * exactly here in this view.
   */
  onPointMove?: (event: PointMoveEvent) => void;
  /** The empty area was double-clicked. The app decides whether and how to add a point. */
  onPointAdd?: (event: PointAddEvent) => void;
  /** A point was double-clicked. `date` is the date of the point. Your app decides what happens, for example a finer view. */
  onPointDoubleClick?: (event: PointDoubleClickEvent) => void;
  /** A line that leaves the view was double-clicked, on its label or on the line. Your app decides what happens, for example a jump to the period of `date`. */
  onLeadDoubleClick?: (event: LeadDoubleClickEvent) => void;
  /** The data of the current view is invalid. Without this callback the errors go to `console.error`. */
  onError?: (errors: string[]) => void;
};

export type PathWorldOptions = PathWorldEvents & {
  /** Period key → data. Pass a new object for every period that changed and keep the others as they are. */
  periods: PeriodMap;
  /** Key of the period to show, from `periodOf(...).key`. Any other key shows a free view. */
  view: string;
  /** Today as `YYYY-MM-DD`. Default: the local date. */
  today?: string;
  /** Changes the generated layout. The same seed always gives the same layout. Default 1. */
  seed?: number;
  /** Allow moving and adding points. Default true. */
  editable?: boolean;
  /** Points cannot be dragged. Default false. */
  pointsLocked?: boolean;
  /**
   * A dragged point moves only across the time axis (up and down when time runs left to right). Its place along the
   * axis stays at its date, so the marker for today and the lines always agree with it. Default true.
   */
  timeLocked?: boolean;
  /** Distance between the grid points that dragged and added points snap to, in world units. Default: no snapping. */
  snap?: number;
  /** Slight wave on the lines. Default false. */
  wavy?: boolean;
  /** Language of the dates under the points, such as `de` or `en-GB`. Default: the browser's language. */
  locale?: string;
  /** Writes the date under a point yourself, for example with your own date library. Wins over `locale`. */
  formatDate?: (iso: string) => string;
  /** Moving parts: flowing dashes, pulses, glow. Default on, but off when the user prefers reduced motion. */
  animate?: boolean;
  background?: BackgroundOptions;
  /**
   * Which way time runs: `horizontal` (default, left to right), `horizontal-inverted` (right to left), `vertical`
   * (top to bottom), `vertical-inverted` (bottom to top) or `auto` (vertical on a tall screen, otherwise horizontal).
   * Only the picture turns: the data, the stored positions and the events stay the same.
   */
  orientation?: Orientation;
  /** Keys M (center) and E (fit). Default true. */
  shortcuts?: boolean;
};

export type CameraListener = (camera: Camera) => void;

export type PathWorldHandle = {
  /** Applies new options. Only what changed is recomputed and redrawn. */
  update(options: PathWorldOptions): void;
  zoomBy(factor: number): void;
  /** Shows the whole content. */
  fit(): void;
  /** Puts the content in the middle. The zoom stays. */
  center(): void;
  getCamera(): Camera;
  /** Where a point is right now, or null if it is not in the current view. */
  positionOf(id: string): Position | null;
  /** Calls the listener on every camera change. Returns a function that stops listening. */
  subscribeCamera(listener: CameraListener): () => void;
  /** Calls the listener when points were laid out again or moved. Returns a function that stops listening. */
  subscribeWorld(listener: () => void): () => void;
  /** The direction time runs on the screen right now. With `orientation: 'auto'` this is the one that was chosen. */
  getDirection(): Direction;
  /** Increases whenever the points were laid out again or moved. */
  getWorldVersion(): number;
  /** Element that follows the camera. Controls placed here move and scale with the world. */
  readonly overlay: HTMLElement;
  destroy(): void;
};
