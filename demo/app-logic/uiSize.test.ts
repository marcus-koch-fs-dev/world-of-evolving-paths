import { describe, expect, it } from 'vitest';
import { clampScale, MAX_SCALE, MIN_SCALE, scalePercent } from './uiSize';

describe('Size of the controls', () => {
  it('has a size for each preset', () => {
    expect(scalePercent('small', 100)).toBe(87.5);
    expect(scalePercent('regular', 80)).toBe(100);
    expect(scalePercent('large', 100)).toBe(125);
  });

  it('uses the own number for custom, kept within the limits', () => {
    expect(scalePercent('custom', 110)).toBe(110);
    expect(scalePercent('custom', 10)).toBe(MIN_SCALE);
    expect(scalePercent('custom', 999)).toBe(MAX_SCALE);
  });

  it('falls back to 100 percent for a number that is not one', () => {
    expect(clampScale(Number.NaN)).toBe(100);
  });
});
