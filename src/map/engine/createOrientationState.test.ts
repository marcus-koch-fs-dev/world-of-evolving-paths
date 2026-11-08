import { describe, expect, it } from 'vitest';
import { createOrientationState } from './createOrientationState.js';

const wide = { width: 800, height: 400 };
const tall = { width: 400, height: 800 };

describe('Orientation state', () => {
  describe('when nothing was synced yet', () => {
    it('runs time from left to right', () => {
      const state = createOrientationState();

      expect(state.direction()).toBe('horizontal');
    });
  });

  describe('when auto meets a tall map', () => {
    it('turns vertical and says that the direction changed, once', () => {
      const state = createOrientationState();

      const first = state.sync('auto', tall);
      const second = state.sync('auto', tall);

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(state.direction()).toBe('vertical');
    });
  });

  describe('when auto meets a wide map after a tall one', () => {
    it('turns back to horizontal', () => {
      const state = createOrientationState();
      state.sync('auto', tall);

      const changed = state.sync('auto', wide);

      expect(changed).toBe(true);
      expect(state.direction()).toBe('horizontal');
    });
  });

  describe('when the direction is vertical', () => {
    it('turns a position for the screen and back to the same one', () => {
      const state = createOrientationState();
      state.sync('vertical', wide);
      const position = { x: 30, y: -12 };

      const onScreen = state.toScreen(position);

      expect(onScreen).toEqual({ x: -12, y: 30 });
      expect(state.toLayout(onScreen)).toEqual(position);
    });
  });
});
