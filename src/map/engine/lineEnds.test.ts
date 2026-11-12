import { describe, expect, it } from 'vitest';
import type { LeadDraw } from '../../core/scene/types.js';
import type { PlacedPoint } from '../../core/types.js';
import { lineEndHeights } from './lineEnds.js';

const point = { id: 'a', pathId: 'gym', title: 'A', date: '2026-11-10', kind: 'milestone', next: [], x: 0, y: 0 };
const byId = new Map([['a', point as unknown as PlacedPoint]]);

const leadOf = (key: string, side: 'before' | 'after', endY: number, extra: Partial<LeadDraw> = {}) =>
  ({
    id: key,
    pointId: 'a',
    lead: { title: 'Out', date: '2026-12-20', id: `out-${key}` },
    side,
    end: { x: 100, y: endY },
    trackKey: key,
    lane: -100,
    line: [],
    ...extra,
  }) as unknown as LeadDraw;

const same = <T>(position: T) => position;

describe('Heights of the ends of the lines', () => {
  describe('when the leads of a view are listed', () => {
    it('gives each line end as a distance from the lane of its path', () => {
      const ends = lineEndHeights([leadOf('after', 'after', -60), leadOf('before', 'before', -150)], byId, same, {
        key: 'none',
        startY: 0,
      });

      expect(ends.map((end) => end.y)).toEqual([40, -50]);
    });

    it('names the two points of each line', () => {
      const [end] = lineEndHeights([leadOf('after', 'after', 0)], byId, same, { key: 'none', startY: 0 });

      expect(end.from.id).toBe('a');
      expect(end.to.id).toBe('out-after');
    });

    it('counts the dragged line with the height it had when it was taken', () => {
      const [end] = lineEndHeights([leadOf('after', 'after', 250)], byId, same, { key: 'after', startY: -40 });

      expect(end.y).toBe(60);
    });

    it('leaves out a line across the whole view', () => {
      const spanning = leadOf('through', 'after', 0, {
        span: { from: { title: 'x', date: 'd' }, to: { title: 'y', date: 'd' } },
      });

      expect(lineEndHeights([spanning], byId, same, { key: 'none', startY: 0 })).toEqual([]);
    });
  });
});
