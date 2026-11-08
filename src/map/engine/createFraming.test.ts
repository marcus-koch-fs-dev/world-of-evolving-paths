import { describe, expect, it, vi } from 'vitest';
import type { CameraController } from '../camera/createCameraController.js';
import { createFraming } from './createFraming.js';

const content = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
const size = { width: 800, height: 600 };
const createCamera = () => ({ fit: vi.fn(), center: vi.fn() });
const asCamera = (camera: ReturnType<typeof createCamera>) => camera as unknown as CameraController;

describe('Framing', () => {
  describe('when the first view is shown', () => {
    it('fits the content once', () => {
      const camera = createCamera();
      const framing = createFraming();

      framing.requestForView();
      framing.apply(content, size, asCamera(camera));
      framing.apply(content, size, asCamera(camera));

      expect(camera.fit).toHaveBeenCalledTimes(1);
      expect(camera.center).not.toHaveBeenCalled();
    });
  });

  describe('when a later view is shown', () => {
    it('centers the content so the zoom stays', () => {
      const camera = createCamera();
      const framing = createFraming();
      framing.requestForView();
      framing.apply(content, size, asCamera(camera));

      framing.requestForView();
      framing.apply(content, size, asCamera(camera));

      expect(camera.center).toHaveBeenCalledTimes(1);
    });
  });

  describe('when there is no content or no room yet', () => {
    it('waits and frames as soon as it can', () => {
      const camera = createCamera();
      const framing = createFraming();
      framing.requestFit();

      framing.apply(null, size, asCamera(camera));
      framing.apply(content, { width: 1, height: 1 }, asCamera(camera));
      framing.apply(content, size, asCamera(camera));

      expect(camera.fit).toHaveBeenCalledTimes(1);
    });
  });

  describe('when nothing was requested', () => {
    it('leaves the camera alone', () => {
      const camera = createCamera();

      createFraming().apply(content, size, asCamera(camera));

      expect(camera.fit).not.toHaveBeenCalled();
      expect(camera.center).not.toHaveBeenCalled();
    });
  });
});
