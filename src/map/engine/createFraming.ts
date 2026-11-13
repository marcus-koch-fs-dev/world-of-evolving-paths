import type { Bounds } from '../../core/camera.js';
import type { CameraController } from '../camera/createCameraController.js';

type Pending = { kind: 'fit' } | { kind: 'center'; zoom?: number } | null;
type Size = { width: number; height: number };

export type Framing = {
  /**
   * A new view. With a zoom, the content is centered at that zoom. Without one, the first view is fitted and later ones
   * are centered so the zoom stays.
   */
  requestForView(zoom?: number): void;
  /** Show all content again, for example after the direction changed. */
  requestFit(): void;
  /** Fits or centers once there is content and room, then not again until requested. */
  apply(content: Bounds | null, size: Size, camera: CameraController): void;
};

/** Remembers whether the camera still has to fit or center on the content, and does it as soon as that is possible. */
export function createFraming(): Framing {
  let pending: Pending = null;
  let framedOnce = false;

  return {
    requestForView(zoom) {
      if (zoom !== undefined) pending = { kind: 'center', zoom };
      else pending = framedOnce ? { kind: 'center' } : { kind: 'fit' };
    },
    requestFit() {
      pending = { kind: 'fit' };
    },
    apply(content, { width, height }, camera) {
      if (!pending || !content || width <= 1 || height <= 1) return;
      if (pending.kind === 'fit') camera.fit(content);
      else camera.center(content, pending.zoom);
      pending = null;
      framedOnce = true;
    },
  };
}
