import { type Bounds, type Camera, centerOn, fitBounds, zoomAt } from '../../core/camera';
import type { CameraListener } from '../options';

type ViewportSize = { width: number; height: number };

export type CameraController = {
  get(): Camera;
  set(camera: Camera): void;
  subscribe(listener: CameraListener): () => void;
  zoomAtPoint(screenX: number, screenY: number, factor: number): void;
  /** Zooms around the middle of the viewport, for buttons. */
  zoomBy(factor: number): void;
  moveBy(dx: number, dy: number): void;
  fit(bounds: Bounds): void;
  center(bounds: Bounds): void;
};

/** Holds the camera and tells listeners when it changes. The math lives in `core/camera`. */
export function createCameraController(viewportSize: () => ViewportSize): CameraController {
  let camera: Camera = { x: 0, y: 0, zoom: 1 };
  const listeners = new Set<CameraListener>();

  const set = (next: Camera) => {
    camera = next;
    listeners.forEach((listener) => {
      listener(next);
    });
  };

  const zoomAtPoint = (screenX: number, screenY: number, factor: number) =>
    set(zoomAt(camera, screenX, screenY, factor));

  return {
    get: () => camera,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    zoomAtPoint,
    zoomBy(factor) {
      const { width, height } = viewportSize();
      zoomAtPoint(width / 2, height / 2, factor);
    },
    moveBy: (dx, dy) => set({ ...camera, x: camera.x + dx, y: camera.y + dy }),
    fit(bounds) {
      const { width, height } = viewportSize();
      set(fitBounds(bounds, width, height));
    },
    center(bounds) {
      const { width, height } = viewportSize();
      set(centerOn(bounds, width, height, camera.zoom));
    },
  };
}
