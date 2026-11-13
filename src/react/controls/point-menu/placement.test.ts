import { describe, expect, it } from 'vitest';
import { anchorFor, nextPlacement, resolvePlacement, subPlacementFor } from './placement.js';

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
  it('goes beside the tiles when the menu is under the point', () => {
    expect(subPlacementFor('below')).toBe('right');
  });

  it('goes up when the menu is over the point', () => {
    expect(subPlacementFor('above')).toBe('above');
  });

  it('goes under the tiles when the menu is beside the point', () => {
    expect(subPlacementFor('right')).toBe('below');
    expect(subPlacementFor('left')).toBe('below');
  });
});

describe('Turning the menu around its point', () => {
  it('goes clockwise: above, right, below, left, and then back to automatic', () => {
    expect(nextPlacement('auto')).toBe('above');
    expect(nextPlacement('above')).toBe('right');
    expect(nextPlacement('right')).toBe('below');
    expect(nextPlacement('below')).toBe('left');
    expect(nextPlacement('left')).toBe('auto');
  });

  it('starts at automatic for a value that is not a place', () => {
    expect(nextPlacement('sideways' as never)).toBe('auto');
  });
});
