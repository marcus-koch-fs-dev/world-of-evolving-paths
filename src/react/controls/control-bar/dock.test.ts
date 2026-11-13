import { describe, expect, it } from 'vitest';
import { alignOf, DOCK_SLOTS, edgeOf, slotAt } from './dock.js';

describe('Docking a bar', () => {
  it.each([
    [10, 10, 'top-left'],
    [500, 10, 'top-center'],
    [990, 10, 'top-right'],
    [10, 590, 'bottom-left'],
    [500, 590, 'bottom-center'],
    [990, 590, 'bottom-right'],
  ] as const)('drops a bar at %i, %i into %s', (x, y, slot) => {
    expect(slotAt(x, y, 1000, 600)).toBe(slot);
  });

  it('splits a slot into its edge and its place along it', () => {
    expect(edgeOf('bottom-right')).toBe('bottom');
    expect(alignOf('bottom-right')).toBe('right');
    expect(edgeOf('top-center')).toBe('top');
    expect(alignOf('top-center')).toBe('center');
    expect(alignOf('top-left')).toBe('left');
  });
});

describe('The zones of the dock', () => {
  it('has a left, a middle and a right zone at each edge', () => {
    expect(DOCK_SLOTS).toEqual(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']);
  });

  it('gives every zone back its own edge and place', () => {
    const rebuilt = DOCK_SLOTS.map((slot) => `${edgeOf(slot)}-${alignOf(slot)}`);

    expect(rebuilt).toEqual([...DOCK_SLOTS]);
  });
});
