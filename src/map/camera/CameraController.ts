import { type Bounds, type Camera, centerOn, fitBounds, zoomAt } from '../../core/camera';
import type { CameraListener } from '../options';

type ViewportSize = { width: number; height: number };

/** Holds the camera and tells listeners when it changes. Does not know about the DOM. */
export class CameraController {
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  private readonly listeners = new Set<CameraListener>();

  constructor(private readonly viewportSize: () => ViewportSize) {}

  get(): Camera {
    return this.camera;
  }

  set(camera: Camera): void {
    this.camera = camera;
    for (const listener of this.listeners) listener(camera);
  }

  subscribe(listener: CameraListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  zoomAtPoint(screenX: number, screenY: number, factor: number): void {
    this.set(zoomAt(this.camera, screenX, screenY, factor));
  }

  /** Zooms around the middle of the viewport, for buttons. */
  zoomBy(factor: number): void {
    const { width, height } = this.viewportSize();
    this.zoomAtPoint(width / 2, height / 2, factor);
  }

  moveBy(dx: number, dy: number): void {
    this.set({ ...this.camera, x: this.camera.x + dx, y: this.camera.y + dy });
  }

  fit(bounds: Bounds): void {
    const { width, height } = this.viewportSize();
    this.set(fitBounds(bounds, width, height));
  }

  center(bounds: Bounds): void {
    const { width, height } = this.viewportSize();
    this.set(centerOn(bounds, width, height, this.camera.zoom));
  }
}
