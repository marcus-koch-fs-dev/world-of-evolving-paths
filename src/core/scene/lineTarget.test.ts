import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../../tests/fixtures.js';
import { toDay } from '../dates.js';
import type { PathInfo, PlacedPoint, PlacedWorld } from '../types.js';
import { buildScene } from './buildScene.js';
import { lineTargetAt } from './lineTarget.js';
import type { SceneState } from './types.js';

const calm: SceneState = { wave: false, hovered: null, dragging: null, locale: 'en' };
const november = { start: toDay('2026-11-01'), end: toDay('2026-11-30') };

const placed = (id: string, date: string, x: number, extra: Partial<PlacedPoint> = {}): PlacedPoint =>
  ({ ...makePoint({ id, date, title: id, ...extra }), x, y: 0 }) as PlacedPoint;

const worldOf = (points: PlacedPoint[], paths: PathInfo[] = [makePath('combat')]): PlacedWorld => ({
  today: '2026-11-11',
  period: november,
  paths,
  points,
});

describe('Line under a position', () => {
  describe('when two points are connected', () => {
    const world = worldOf([placed('a', '2026-11-02', 100, { next: ['b'] }), placed('b', '2026-11-20', 900)]);

    it('finds the connection with both points, the earlier first', () => {
      const scene = buildScene(world, calm);

      const target = lineTargetAt(scene, world.points, { x: 500, y: 0 });

      expect(target?.from).toEqual({ id: 'a', title: 'a', date: '2026-11-02' });
      expect(target?.to).toEqual({ id: 'b', title: 'b', date: '2026-11-20' });
    });

    it('finds nothing far from the line', () => {
      expect(lineTargetAt(buildScene(world, calm), world.points, { x: 500, y: 300 })).toBeNull();
    });
  });

  describe('when a line comes in from outside the view', () => {
    it('has the point out there as its start and the point of the view as its end', () => {
      const point = placed('goal', '2026-11-20', 900, {
        incoming: [{ title: 'Start', date: '2026-10-15', id: 'start' }],
      });
      const scene = buildScene(worldOf([point]), calm);
      const lead = scene.leads[0];

      const target = lineTargetAt(scene, [point], lead.line[Math.floor(lead.line.length / 2)]);

      expect(target?.from).toEqual({ id: 'start', title: 'Start', date: '2026-10-15' });
      expect(target?.to.id).toBe('goal');
    });
  });

  describe('when a line spans the whole view', () => {
    it('has both points out there as its ends', () => {
      const path: PathInfo = {
        ...makePath('reading'),
        through: [
          {
            from: { title: 'Before', date: '2026-10-12', id: 'before' },
            to: { title: 'After', date: '2026-12-20', id: 'after' },
          },
        ],
      };
      const scene = buildScene(worldOf([], [path]), calm);
      const lead = scene.leads[0];

      const target = lineTargetAt(scene, [], lead.line[0]);

      expect(target?.from.id).toBe('before');
      expect(target?.to.id).toBe('after');
    });
  });
});
