import { describe, expect, it } from 'vitest';
import { clampZoom, fitBounds, MAX_ZOOM, MIN_ZOOM, pinchStep, screenToWorld, zoomAt } from './camera.js';

describe('Camera', () => {
  describe('when zooming around a screen point', () => {
    it('keeps the world point under the cursor in place', () => {
      const camera = { x: 40, y: -20, zoom: 1 };
      const before = screenToWorld(camera, 300, 200);

      const zoomed = zoomAt(camera, 300, 200, 1.5);

      const after = screenToWorld(zoomed, 300, 200);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);
    });

    it('never leaves the allowed zoom range', () => {
      expect(clampZoom(100)).toBe(MAX_ZOOM);
      expect(clampZoom(0.001)).toBe(MIN_ZOOM);
    });
  });

  describe('when fitting bounds', () => {
    it('puts the middle of the bounds into the middle of the viewport', () => {
      const camera = fitBounds({ minX: 0, minY: 0, maxX: 400, maxY: 200 }, 1000, 600);

      const middle = screenToWorld(camera, 500, 300);
      expect(middle.x).toBeCloseTo(200);
      expect(middle.y).toBeCloseTo(100);
    });
  });

  describe('when two fingers move', () => {
    it('zooms by the change of their distance', () => {
      const before: [{ x: number; y: number }, { x: number; y: number }] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];
      const after: [{ x: number; y: number }, { x: number; y: number }] = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ];

      const step = pinchStep(before, after);

      expect(step.factor).toBe(2);
    });

    it('moves by the change of their midpoint', () => {
      const before: [{ x: number; y: number }, { x: number; y: number }] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];
      const after: [{ x: number; y: number }, { x: number; y: number }] = [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
      ];

      const step = pinchStep(before, after);

      expect(step.dx).toBe(10);
      expect(step.dy).toBe(20);
    });
  });
});
