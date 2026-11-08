import type { Position } from '../../../core/types.js';
import type { CameraController } from '../../camera/createCameraController.js';

const CLICK_TOLERANCE = 4; // pixels a press may move and still count as a click

export type ClientPoint = { clientX: number; clientY: number };

export type Pan = {
  /** A press on empty space starts a pan. Positions are client coordinates. */
  start(from: Position): void;
  isActive(): boolean;
  stop(): void;
  /**
   * The pointer moved. Small moves right after the press do not pan yet, so a click stays a click.
   * Returns whether the press has moved far enough to no longer count as a click.
   */
  moveTo(at: ClientPoint, alreadyMoved: boolean): boolean;
};

/** Drag to pan: moves the camera by what the pointer moved since the last step. */
export function createPan(camera: CameraController): Pan {
  let last: Position | null = null;

  return {
    start: (from) => {
      last = from;
    },
    isActive: () => last !== null,
    stop: () => {
      last = null;
    },
    moveTo(at, alreadyMoved) {
      if (!last) return alreadyMoved;
      const dx = at.clientX - last.x;
      const dy = at.clientY - last.y;
      const moved = alreadyMoved || Math.abs(dx) + Math.abs(dy) > CLICK_TOLERANCE;
      if (!moved) return false;
      camera.moveBy(dx, dy);
      last = { x: at.clientX, y: at.clientY };
      return true;
    },
  };
}
