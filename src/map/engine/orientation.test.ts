import { describe, expect, it } from 'vitest';
import { resolveOrientation } from './orientation.js';

const portrait = { width: 400, height: 800 };
const landscape = { width: 800, height: 400 };

describe('Orientation of the map', () => {
  it('is horizontal unless asked otherwise', () => {
    expect(resolveOrientation(undefined, portrait)).toBe('horizontal');
    expect(resolveOrientation('horizontal', portrait)).toBe('horizontal');
  });

  it.each(['horizontal-inverted', 'vertical', 'vertical-inverted'] as const)(
    'is %s when asked, whatever the shape',
    (direction) => {
      expect(resolveOrientation(direction, landscape)).toBe(direction);
      expect(resolveOrientation(direction, portrait)).toBe(direction);
    },
  );

  it('treats a value that is not an orientation as horizontal', () => {
    expect(resolveOrientation('sideways' as never, portrait)).toBe('horizontal');
    expect(resolveOrientation('toString' as never, portrait)).toBe('horizontal');
  });

  it('follows the shape of the map with auto', () => {
    expect(resolveOrientation('auto', portrait)).toBe('vertical');
    expect(resolveOrientation('auto', landscape)).toBe('horizontal');
    expect(resolveOrientation('auto', { width: 500, height: 500 })).toBe('horizontal');
  });
});
