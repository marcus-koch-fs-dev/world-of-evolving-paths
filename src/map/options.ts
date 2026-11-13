import type { BackgroundOptions, BackgroundPattern } from '../core/background/types.js';
import type { Camera } from '../core/camera.js';
import type { Direction } from '../core/orientation.js';
import type { LineEnd } from '../core/scene/lineTarget.js';
import type { Store, StoreChanges } from '../core/store/types.js';
import type { Position } from '../core/types.js';

export type { BackgroundOptions, BackgroundPattern };

// Which way time runs on the screen. `auto` is vertical while the map is taller than wide, otherwise horizontal.
export type Orientation = Direction | 'auto';

export type { LineEnd };

export type PointAddEvent = {
  x: number;
  y: number;
  date: string;
  /** The y of the lane of every path in this view, by path id. `y` minus the lane of a path is the height to keep. */
  lanes: Record<string, number>;
};
export type PointDoubleClickEvent = { id: string; date: string };
/** A line that leaves the view was double-clicked: the point it leaves from, the side and what the map knows about the point out there. */
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
  /**
   * The user moved something: a point, an arrow at the border of the view, a whole path, or in the overview a point or a
   * path to a free place. The map made the change and hands you the new `store` and what it touched: `changed` holds
   * the paths that are new or different (whole, with their layout), `removed` the ids of paths that are gone. Keep the
   * store and pass it back as `store`, and save `changed` and `removed` in your database.
   * Without this callback nothing can be moved.
   */
  onStoreChange?: (store: Store, changes: StoreChanges) => void;
  /** A point was clicked (its id) or the empty area was clicked (null). */
  onSelect?: (id: string | null) => void;
  /**
   * A line was clicked or right-clicked: a connection between two points, or a line that leaves the view or spans it.
   * Your app decides what happens, for example a menu to insert a point there. Clicking the empty area calls
   * `onSelect(null)`, which is the time to close that menu.
   */
  onLineSelect?: (event: LineSelectEvent) => void;
  /** The empty area was double-clicked. The app decides whether and how to add a point. */
  onPointAdd?: (event: PointAddEvent) => void;
  /** A point was double-clicked. `date` is the date of the point. Your app decides what happens, for example a finer view. */
  onPointDoubleClick?: (event: PointDoubleClickEvent) => void;
  /** A line that leaves the view was double-clicked, on its label or on the line. Your app decides what happens, for example a jump to the period of `date`. */
  onLeadDoubleClick?: (event: LeadDoubleClickEvent) => void;
  /** The data is invalid. Without this callback the errors go to `console.error`. */
  onError?: (errors: string[]) => void;
};

export type PathWorldOptions = PathWorldEvents & {
  /** The paths, each with its branches and points and the layout the user chose. See `createStore`. */
  store: Store;
  /** Key of the period to show, from `periodOf(...).key`. Any other key shows the overview of everything. */
  view: string;
  /** Show only these paths, for an app that pages through them. Pass the same array while it does not change. Default: all. */
  pathIds?: readonly string[];
  /** Today as `YYYY-MM-DD`. Default: the local date. */
  today?: string;
  /** Allow moving and adding points. Default true. */
  editable?: boolean;
  /** Points cannot be dragged. Default false. */
  pointsLocked?: boolean;
  /**
   * A dragged point moves only across the time axis (up and down when time runs left to right). Its place along the
   * axis stays at its date, so the marker for today and the lines always agree with it. Default true.
   */
  timeLocked?: boolean;
  /**
   * In the overview: points and whole paths can be moved freely, in every direction, without a time axis. The places
   * are kept apart from the heights of the levels. Default false: the overview is only to look at. It works also when
   * `editable` is false, so a viewer can arrange the overview for themselves.
   */
  freeMove?: boolean;
  /** Distance between the grid points that dragged and added points snap to, in world units. Default: no snapping. */
  snap?: number;
  /**
   * The zoom a new view starts at. When the view changes (another level, period or page) the content is centered at
   * this zoom. Keep the zoom of each level in your app and pass it here. Default: the first view is fitted, later ones
   * keep the zoom they had.
   */
  zoom?: number;
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
  /** Calls the listener when the world was made again or points were moved. Returns a function that stops listening. */
  subscribeWorld(listener: () => void): () => void;
  /** The direction time runs on the screen right now. With `orientation: 'auto'` this is the one that was chosen. */
  getDirection(): Direction;
  /** Increases whenever the world was made again or points were moved. */
  getWorldVersion(): number;
  /** Element that follows the camera. Controls placed here move and scale with the world. */
  readonly overlay: HTMLElement;
  destroy(): void;
};
