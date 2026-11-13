import { describe, expect, it } from 'vitest';
import { anchorFor, nextSubPlacement, resolvePlacement } from './placement.js';

describe('Menu placement', () => {
  describe('when the placement is automatic', () => {
    it('goes below the point when there is room', () => {
      expect(resolvePlacement('auto', 100, 800)).toBe('below');
    });

    it('goes above the point when the point is near the bottom', () => {
      expect(resolvePlacement('auto', 600, 800)).toBe('above');
    });
  });

  describe('when the app chooses a side', () => {
    it.each(['below', 'above', 'right', 'left'] as const)('keeps %s whatever the room', (placement) => {
      expect(resolvePlacement(placement, 790, 800)).toBe(placement);
    });
  });

  describe('when anchoring next to a point', () => {
    const point = { x: 100, y: 200 };

    it('puts the menu below, in line with the point', () => {
      const anchor = anchorFor('below', point);

      expect(anchor.left).toBe(100);
      expect(anchor.top).toBeGreaterThan(200);
    });

    it('puts the menu above, in line with the point', () => {
      expect(anchorFor('above', point).top).toBeLessThan(200);
    });

    it('puts the menu to the side, level with the point', () => {
      expect(anchorFor('right', point)).toMatchObject({ top: 200 });
      expect(anchorFor('right', point).left).toBeGreaterThan(100);
      expect(anchorFor('left', point).left).toBeLessThan(100);
    });
  });
});

describe('Place of the panel of a tile', () => {
  it('goes clockwise around the tiles: above, right, below, left, above', () => {
    expect(nextSubPlacement('above')).toBe('right');
    expect(nextSubPlacement('right')).toBe('below');
    expect(nextSubPlacement('below')).toBe('left');
    expect(nextSubPlacement('left')).toBe('above');
  });

  it('starts at right for a value that is not a place', () => {
    expect(nextSubPlacement('sideways' as never)).toBe('right');
  });
});
