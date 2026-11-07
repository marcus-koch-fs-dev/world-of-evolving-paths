import { describe, expect, it } from 'vitest';
import { makePoint } from '../../../tests/fixtures';
import type { PlacedPoint } from '../../core/types';
import { buildMoveEvent, rounded } from './events';

const placed = (id: string, x: number, y: number): PlacedPoint => ({ ...makePoint({ id }), x, y });

describe('Move events', () => {
  it('rounds positions to whole numbers', () => {
    expect(rounded({ x: 1.4, y: 2.6 })).toEqual({ x: 1, y: 3 });
  });

  it('reports the moved point and where every point of the view is', () => {
    const points = [placed('a', 10.2, 20.7), placed('b', 30, 40)];

    const event = buildMoveEvent(points, 'a', { x: 55.5, y: 66.4 });

    expect(event).toEqual({ id: 'a', x: 56, y: 66, positions: { a: { x: 56, y: 66 }, b: { x: 30, y: 40 } } });
  });
});
