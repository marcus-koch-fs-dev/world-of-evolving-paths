import { describe, expect, it, vi } from 'vitest';
import type { CameraController } from '../../camera/createCameraController.js';
import { createFingers } from './createFingers.js';

const createCamera = () => ({ zoomAtPoint: vi.fn(), moveBy: vi.fn() });
const asCamera = (camera: ReturnType<typeof createCamera>) => camera as unknown as CameraController;

describe('Fingers', () => {
  describe('when one finger moves', () => {
    it('is no pinch and leaves the camera alone', () => {
      const camera = createCamera();
      const fingers = createFingers(asCamera(camera));
      fingers.add(1, { x: 10, y: 10 });

      const pinched = fingers.moveTo(1, { x: 30, y: 10 });

      expect(pinched).toBe(false);
      expect(camera.zoomAtPoint).not.toHaveBeenCalled();
    });
  });

  describe('when two fingers move apart', () => {
    it('zooms in and reports a pinch', () => {
      const camera = createCamera();
      const fingers = createFingers(asCamera(camera));
      fingers.add(1, { x: 100, y: 100 });
      fingers.add(2, { x: 200, y: 100 });

      const pinched = fingers.moveTo(2, { x: 300, y: 100 });

      expect(pinched).toBe(true);
      expect(camera.zoomAtPoint.mock.calls[0][2]).toBeGreaterThan(1);
    });
  });

  describe('when one of two fingers is released', () => {
    it('knows where the finger that is left is', () => {
      const fingers = createFingers(asCamera(createCamera()));
      fingers.add(1, { x: 1, y: 2 });
      fingers.add(2, { x: 3, y: 4 });

      fingers.release(1);

      expect(fingers.count()).toBe(1);
      expect(fingers.onlyOne()).toEqual({ x: 3, y: 4 });
    });
  });

  describe('when there are two fingers', () => {
    it('has no single finger', () => {
      const fingers = createFingers(asCamera(createCamera()));
      fingers.add(1, { x: 1, y: 2 });
      fingers.add(2, { x: 3, y: 4 });

      expect(fingers.onlyOne()).toBeNull();
    });
  });
});
