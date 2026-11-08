import { pinchStep } from '../../../core/camera.js';
import type { Position } from '../../../core/types.js';
import type { CameraController } from '../../camera/createCameraController.js';

export type Fingers = {
  /** A finger touched the map at this position inside the element. */
  add(id: number, at: Position): void;
  release(id: number): void;
  has(id: number): boolean;
  count(): number;
  clear(): void;
  /** The position of the one finger that is left, or null when there are none or several. */
  onlyOne(): Position | null;
  /** A finger moved. With exactly two fingers down the camera zooms and moves like a pinch and this returns true. */
  moveTo(id: number, at: Position): boolean;
};

/** Follows the fingers on the map and turns two of them into a pinch of the camera. */
export function createFingers(camera: CameraController): Fingers {
  const fingers = new Map<number, Position>();

  return {
    add: (id, at) => {
      fingers.set(id, at);
    },
    release: (id) => {
      fingers.delete(id);
    },
    has: (id) => fingers.has(id),
    count: () => fingers.size,
    clear: () => fingers.clear(),
    onlyOne: () => (fingers.size === 1 ? ([...fingers.values()][0] ?? null) : null),

    moveTo(id, at) {
      const before = [...fingers.values()];
      if (fingers.has(id)) fingers.set(id, at);
      if (before.length !== 2) return false;
      const step = pinchStep(before as [Position, Position], [...fingers.values()] as [Position, Position]);
      camera.zoomAtPoint(step.px, step.py, step.factor);
      camera.moveBy(step.dx, step.dy);
      return true;
    },
  };
}
