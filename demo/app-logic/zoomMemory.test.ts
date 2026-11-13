import { describe, expect, it } from 'vitest';
import { memoryFrom, withZoom, zoomKeyOf } from './zoomMemory';

describe('Zoom of each layer', () => {
  it('has one key per level and one for the overview', () => {
    expect(zoomKeyOf('week')).toBe('week');
    expect(zoomKeyOf(null)).toBe('all');
  });

  it('sets the zoom of one layer and leaves the others', () => {
    expect(withZoom({ week: 1, year: 0.5 }, 'week', 1.5)).toEqual({ week: 1.5, year: 0.5 });
  });

  it('rounds the zoom and keeps the same memory when nothing changes', () => {
    const memory = { week: 1.234 };

    expect(withZoom(memory, 'week', 1.23400001)).toBe(memory);
    expect(withZoom({}, 'month', 0.12345678)).toEqual({ month: 0.123 });
  });

  it('ignores a zoom that is not a positive number', () => {
    const memory = { week: 1 };

    expect(withZoom(memory, 'week', 0)).toBe(memory);
    expect(withZoom(memory, 'week', Number.NaN)).toBe(memory);
  });

  it('reads stored data and drops what is not a zoom', () => {
    expect(memoryFrom({ week: 1, month: 'big', year: -2, all: 0.4 })).toEqual({ week: 1, all: 0.4 });
    expect(memoryFrom(null)).toEqual({});
    expect(memoryFrom('x')).toEqual({});
  });
});
