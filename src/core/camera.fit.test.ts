import { describe, expect, it } from 'vitest';
import { fitBounds } from './camera.js';

describe('Fitting the camera', () => {
  describe('when the content is wider than tall', () => {
    it('fills 60 percent of the viewport, so a good frame stays around it', () => {
      const camera = fitBounds({ minX: 0, minY: 0, maxX: 1000, maxY: 500 }, 1000, 800);

      expect(camera.zoom).toBeCloseTo(0.6);
    });
  });

  describe('when there is hardly any content', () => {
    it('does not blow a lone point up', () => {
      const camera = fitBounds({ minX: 10, minY: 10, maxX: 10, maxY: 10 }, 1000, 800);

      expect(camera.zoom).toBeLessThanOrEqual(1.25);
    });
  });
});
