import type { Bounds } from '../../core/camera.js';
import type { CameraController } from '../camera/createCameraController.js';

type Pending = 'fit' | 'center' | null;
type Size = { width: number; height: number };

export type Framing = {
  /** A new view: the first one is fitted, later ones are centered so the zoom stays. */
  requestForView(): void;
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
    requestForView() {
      pending = framedOnce ? 'center' : 'fit';
    },
    requestFit() {
      pending = 'fit';
    },
    apply(content, { width, height }, camera) {
      if (!pending || !content || width <= 1 || height <= 1) return;
      if (pending === 'fit') camera.fit(content);
      else camera.center(content);
      pending = null;
      framedOnce = true;
    },
  };
}
