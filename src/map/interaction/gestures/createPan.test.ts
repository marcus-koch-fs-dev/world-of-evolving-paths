import { describe, expect, it, vi } from 'vitest';
import type { CameraController } from '../../camera/createCameraController.js';
import { createPan } from './createPan.js';

const createCamera = () => ({ moveBy: vi.fn() });
const asCamera = (camera: ReturnType<typeof createCamera>) => camera as unknown as CameraController;

describe('Pan', () => {
  describe('when the pointer moves only a little after the press', () => {
    it('does not move the camera, so the press stays a click', () => {
      const camera = createCamera();
      const pan = createPan(asCamera(camera));
      pan.start({ x: 100, y: 100 });

      const moved = pan.moveTo({ clientX: 102, clientY: 101 }, false);

      expect(moved).toBe(false);
      expect(camera.moveBy).not.toHaveBeenCalled();
    });
  });

  describe('when the pointer moves further than the tolerance', () => {
    it('moves the camera by the whole distance and then by each further step', () => {
      const camera = createCamera();
      const pan = createPan(asCamera(camera));
      pan.start({ x: 100, y: 100 });

      const first = pan.moveTo({ clientX: 120, clientY: 100 }, false);
      const second = pan.moveTo({ clientX: 125, clientY: 110 }, first);

      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(camera.moveBy).toHaveBeenNthCalledWith(1, 20, 0);
      expect(camera.moveBy).toHaveBeenNthCalledWith(2, 5, 10);
    });
  });

  describe('when the press already counts as moved', () => {
    it('pans at once, even by a small step', () => {
      const camera = createCamera();
      const pan = createPan(asCamera(camera));
      pan.start({ x: 0, y: 0 });

      pan.moveTo({ clientX: 1, clientY: 0 }, true);

      expect(camera.moveBy).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('when the pan is stopped', () => {
    it('is no longer active and ignores moves', () => {
      const camera = createCamera();
      const pan = createPan(asCamera(camera));
      pan.start({ x: 0, y: 0 });

      pan.stop();
      pan.moveTo({ clientX: 50, clientY: 50 }, true);

      expect(pan.isActive()).toBe(false);
      expect(camera.moveBy).not.toHaveBeenCalled();
    });
  });
});
