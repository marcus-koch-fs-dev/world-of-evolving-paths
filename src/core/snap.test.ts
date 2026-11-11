import { describe, expect, it } from 'vitest';
import { snapToGrid } from './snap.js';

describe('Snap to grid', () => {
  it('moves a position to the nearest grid point', () => {
    expect(snapToGrid({ x: 52, y: -27 }, 50)).toEqual({ x: 50, y: -50 });
  });

  it('keeps the position without a usable step', () => {
    const position = { x: 13, y: 7 };

    expect(snapToGrid(position, undefined)).toBe(position);
    expect(snapToGrid(position, 0)).toBe(position);
    expect(snapToGrid(position, -5)).toBe(position);
    expect(snapToGrid(position, Number.NaN)).toBe(position);
  });
});
