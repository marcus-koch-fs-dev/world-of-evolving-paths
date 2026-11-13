import { describe, expect, it } from 'vitest';
import { scalePercent, UI_SIZES } from './uiSize';

describe('Size of the controls', () => {
  it('has three fixed forms, each bigger than the one before', () => {
    expect(UI_SIZES.map((entry) => entry.value)).toEqual(['small', 'regular', 'large']);
    expect(scalePercent('small')).toBeLessThan(scalePercent('regular'));
    expect(scalePercent('regular')).toBeLessThan(scalePercent('large'));
  });

  it('draws small in the sizes of the stylesheets', () => {
    expect(scalePercent('small')).toBe(100);
  });

  it('falls back to small for a value that is not a form', () => {
    expect(scalePercent('huge' as never)).toBe(100);
  });
});
