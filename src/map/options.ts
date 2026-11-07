import type { Camera } from '../core/camera';
import type { PeriodMap, Position } from '../core/types';

export type BackgroundPattern = 'none' | 'hex' | 'dots' | 'stars';

export type BackgroundOptions = {
  /** Plain color (default) or a gradient from `base` to `color2`. */
  fill?: 'solid' | 'gradient';
  pattern?: BackgroundPattern;
  /** Base color `#rrggbb`. */
  base?: string;
  /** Color of the pattern. */
  color?: string;
  /** Second color of the gradient. */
  color2?: string;
  /** Direction of the gradient in degrees. */
  angle?: number;
  /** Position of the gradient's middle in percent. */
  mid?: number;
  /** Brightness of the pattern, 0 to 1. */
  intensity?: number;
  /** Size of the pattern, 0.5 to 2. */
  scale?: number;
};

export type PointMoveEvent = {
  id: string;
  x: number;
  y: number;
  /** Where every point of the view is right now. Pin them all to keep the layout exactly as the user sees it. */
  positions: Record<string, Position>;
};
export type PointAddEvent = { x: number; y: number; date: string };

export type PathWorldEvents = {
  /** A point was clicked (its id) or the empty area was clicked (null). */
  onSelect?: (id: string | null) => void;
  /** A dragged point was released. Pass `x` and `y` back on the point to keep it there. */
  onPointMove?: (event: PointMoveEvent) => void;
  /** The empty area was double-clicked. The app decides whether and how to add a point. */
  onPointAdd?: (event: PointAddEvent) => void;
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
  dotsLocked?: boolean;
  /** Slight wave on the lines. Default false. */
  wavy?: boolean;
  background?: BackgroundOptions;
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
  /** Calls the listener on every camera change. Returns a function that stops listening. */
  subscribeCamera(listener: CameraListener): () => void;
  /** Element that follows the camera. Controls placed here move and scale with the world. */
  readonly overlay: HTMLElement;
  destroy(): void;
};
