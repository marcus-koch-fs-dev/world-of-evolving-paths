import { describe, expect, it } from 'vitest';
import { backgroundCss, DEFAULT_BASE } from './backgroundCss';

const camera = { x: 10, y: 20, zoom: 2 };

describe('Background CSS', () => {
  describe('when there is no pattern and no gradient', () => {
    it('is just the base color', () => {
      const css = backgroundCss({}, camera);

      expect(css.backgroundColor).toBe(DEFAULT_BASE);
      expect(css.backgroundImage).toBe('none');
    });
  });

  describe('when there is a pattern', () => {
    it('scales the pattern with the zoom and follows the camera', () => {
      const css = backgroundCss({ pattern: 'dots' }, camera);

      expect(css.backgroundSize).toBe('44px 44px');
      expect(css.backgroundPosition).toBe('10px 20px');
    });

    it('moves the star layers more slowly than the camera', () => {
      const css = backgroundCss({ pattern: 'stars' }, camera);

      expect(css.backgroundPosition.split(', ')).toEqual(['3.5px 7px', '1.5px 3px']);
    });
  });

  describe('when the fill is a gradient', () => {
    it('adds the gradient below the pattern', () => {
      const css = backgroundCss({ fill: 'gradient', pattern: 'dots', angle: 90 }, camera);

      const layers = css.backgroundImage.split('), ');
      expect(layers.at(-1)).toContain('linear-gradient(90deg');
    });
  });
});
