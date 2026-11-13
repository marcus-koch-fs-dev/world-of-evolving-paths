import { describe, expect, it } from 'vitest';
import { menuPlaceLabel, nextMenuPlace } from './menuPlace';

describe('Place of the point menu', () => {
  it('goes around the point clockwise and then back to automatic', () => {
    expect(nextMenuPlace('auto')).toBe('above');
    expect(nextMenuPlace('above')).toBe('right');
    expect(nextMenuPlace('right')).toBe('below');
    expect(nextMenuPlace('below')).toBe('left');
    expect(nextMenuPlace('left')).toBe('auto');
  });

  it('starts at automatic for a value that is not a place', () => {
    expect(nextMenuPlace('sideways' as never)).toBe('auto');
  });

  it('says the place in words', () => {
    expect(menuPlaceLabel('auto')).toBe('automatic');
    expect(menuPlaceLabel('above')).toBe('over the point');
    expect(menuPlaceLabel('left')).toBe('left of the point');
  });
});
