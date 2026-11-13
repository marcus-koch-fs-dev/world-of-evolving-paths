import { describe, expect, it } from 'vitest';
import { showsTileLabels, sizeClass, UI_SIZES } from './uiSize';

describe('Size of the controls', () => {
  it('has three fixed forms', () => {
    expect(UI_SIZES.map((entry) => entry.value)).toEqual(['small', 'regular', 'large']);
  });

  it('gives each form its class, and none for Regular', () => {
    expect(sizeClass('small')).toBe('pw-compact');
    expect(sizeClass('regular')).toBe('');
    expect(sizeClass('large')).toBe('pw-large');
  });

  it('falls back to small for a value that is not a form', () => {
    expect(sizeClass('huge' as never)).toBe('pw-compact');
  });

  it('shows the names of the tiles in Regular and Large, symbols alone in Small', () => {
    expect(showsTileLabels('small')).toBe(false);
    expect(showsTileLabels('regular')).toBe(true);
    expect(showsTileLabels('large')).toBe(true);
  });
});
