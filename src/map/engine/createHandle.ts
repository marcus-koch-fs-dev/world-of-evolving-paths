import type { CameraController } from '../camera/createCameraController.js';
import type { Viewport } from '../dom/createViewport.js';
import type { PathWorldHandle, PathWorldOptions } from '../options.js';
import type { WorldModel } from '../state/createWorldModel.js';
import type { OrientationState } from './createOrientationState.js';
import type { WorldSignal } from './createWorldSignal.js';
import type { Shortcut } from './shortcuts.js';

type Dependencies = {
  viewport: Pick<Viewport, 'overlay'>;
  camera: CameraController;
  model: WorldModel;
  orientation: OrientationState;
  signal: WorldSignal;
  /** Fits the camera to all points or centers it on them. Does nothing when there are no points. */
  show(kind: Shortcut): void;
  update(options: PathWorldOptions): void;
  destroy(): void;
};

/** What the app gets back from `createPathWorld`: the public methods, each one handed to the part that does it. */
export function createHandle({
  viewport,
  camera,
  model,
  orientation,
  signal,
  show,
  update,
  destroy,
}: Dependencies): PathWorldHandle {
  return {
    overlay: viewport.overlay,
    update,
    positionOf(id) {
      const point = model.world()?.points.find((candidate) => candidate.id === id);
      return point ? orientation.toScreen({ x: point.x, y: point.y }) : null;
    },
    zoomBy: (factor) => camera.zoomBy(factor),
    fit: () => show('fit'),
    center: () => show('center'),
    getCamera: () => camera.get(),
    subscribeCamera: (listener) => camera.subscribe(listener),
    subscribeWorld: signal.subscribe,
    getWorldVersion: signal.version,
    getDirection: orientation.direction,
    destroy,
  };
}
