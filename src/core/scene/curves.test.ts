import { describe, expect, it } from 'vitest';
import { cutAt, dashSegments, pointAt } from './curves.js';

const straight = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

describe('Dashed lines', () => {
  it('starts with a dash and a gap of the given size', () => {
    const pieces = dashSegments(straight, [10, 10]);

    expect(pieces).toHaveLength(5);
    expect(pieces[0]).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    expect(pieces[1][0].x).toBe(20);
  });

  it('moves the pattern forward with the shift', () => {
    const [first] = dashSegments(straight, [10, 10], 5);

    expect(first[0].x).toBe(5);
    expect(first[1].x).toBe(15);
  });

  it('cuts a dash at a corner into one piece per straight part', () => {
    const corner = [
      { x: 0, y: 0 },
      { x: 15, y: 0 },
      { x: 15, y: 15 },
    ];

    const pieces = dashSegments(corner, [10, 10], 10);

    expect(pieces.length).toBeGreaterThanOrEqual(2);
    expect(pieces.every(([a, b]) => a.x === b.x || a.y === b.y)).toBe(true);
  });

  it('draws nothing for a pattern without dashes and handles very long lines', () => {
    expect(dashSegments(straight, [0, 10])).toEqual([]);
    expect(
      dashSegments(
        [
          { x: 0, y: 0 },
          { x: 1_000_000, y: 0 },
        ],
        [2, 10],
      ),
    ).toHaveLength(83334);
  });
});

describe('Cutting a line', () => {
  it('keeps the line whole from fraction 1 on', () => {
    expect(cutAt(straight, 1)).toBe(straight);
  });

  it('ends at the point of the fraction', () => {
    expect(pointAt(straight, 0.25)).toEqual({ x: 25, y: 0 });
    expect(cutAt(straight, 0)).toEqual([straight[0], straight[0]]);
  });
});
