import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../../tests/fixtures.js';
import { toDay } from '../dates.js';
import type { PathInfo, PlacedPoint, PlacedWorld } from '../types.js';
import { buildScene } from './buildScene.js';
import { throughLines, todayOnThrough } from './through.js';
import { lineTracks } from './tracks.js';
import type { SceneState } from './types.js';

const linesOf = (world: PlacedWorld) => throughLines(world, lineTracks(world));
const calm: SceneState = { wave: false, hovered: null, dragging: null, locale: 'en' };
const november = { start: toDay('2026-11-01'), end: toDay('2026-11-30') };

const through: PathInfo = {
  ...makePath('reading', '#3b82f6'),
  through: [{ from: { title: 'Chapter 2', date: '2026-10-12' }, to: { title: 'Chapter 3', date: '2026-12-20' } }],
};

const worldOf = (extra: Partial<PlacedWorld> = {}, points: PlacedPoint[] = []): PlacedWorld => ({
  today: '2026-11-11',
  period: november,
  paths: [through],
  points,
  ...extra,
});

describe('Path that runs through the view', () => {
  describe('when the view is a period and the path has no point in it', () => {
    it('is a line across the whole view on the lane of the path', () => {
      const [line] = linesOf(worldOf());

      expect(line.from.x).toBeLessThan(line.to.x);
      expect(line.from.y).toBe(line.to.y);
    });

    it('is drawn with a line and a label with title and date at each end', () => {
      const scene = buildScene(worldOf(), calm);

      expect(scene.edges).toHaveLength(1);
      expect(scene.leads.map((lead) => lead.side)).toEqual(['before', 'after']);
      expect(scene.leads[0].text).toContain('Chapter 2');
      expect(scene.leads[1].text).toContain('Chapter 3');
    });

    it('carries today on its line, on the day of today', () => {
      const [line] = linesOf(worldOf());

      const at = todayOnThrough(worldOf(), line);

      expect(at?.y).toBe(line.from.y);
      expect(at?.x).toBeGreaterThan(line.from.x);
      expect(at?.x).toBeLessThan(line.to.x);
      expect(buildScene(worldOf(), calm).heres).toHaveLength(1);
    });
  });

  describe('when it has a height at each end', () => {
    const slanted: PathInfo = {
      ...through,
      through: [{ ...(through.through?.[0] as NonNullable<PathInfo['through']>[number]), yStart: -100, yEnd: 100 }],
    };

    it('runs from the one height to the other, from the lane of its path', () => {
      const [line] = linesOf(worldOf({ paths: [slanted] }));

      // One path has its lane at 0
      expect(line.from.y).toBe(-100);
      expect(line.to.y).toBe(100);
    });

    it('carries today at the height of the line on that day, between its two ends', () => {
      const world = worldOf({ paths: [slanted] });
      const [line] = linesOf(world);

      const at = todayOnThrough(world, line);

      expect(at?.y).toBeGreaterThan(-100);
      expect(at?.y).toBeLessThan(100);
    });

    it('gives each end its own key, so the two can be dragged apart', () => {
      const scene = buildScene(worldOf({ paths: [slanted] }), calm);

      expect(scene.leads.map((lead) => lead.trackKey)).toEqual(['through:reading:0:start', 'through:reading:0:end']);
    });

    it('follows the height an end is dragged to', () => {
      const world = worldOf({ paths: [slanted] });

      const [line] = throughLines(world, lineTracks(world), new Map([['through:reading:0:start', 40]]));

      expect(line.from.y).toBe(40);
      expect(line.to.y).toBe(100);
    });
  });

  describe('when the point at its end has been reached', () => {
    it('is a solid line like any walked connection, not a dotted one', () => {
      const past: PathInfo = {
        ...through,
        through: [{ from: { title: 'Chapter 2', date: '2026-10-12' }, to: { title: 'Chapter 3', date: '2026-11-05' } }],
      };

      const [edge] = buildScene(worldOf({ paths: [past], today: '2026-11-11' }), calm).edges;

      expect(edge.dash).toBeNull();
    });

    it('is dotted while that point is still ahead', () => {
      const [edge] = buildScene(worldOf(), calm).edges;

      expect(edge.dash).not.toBeNull();
    });
  });

  describe('when the view has no period', () => {
    it('is not drawn', () => {
      expect(linesOf(worldOf({ period: null }))).toEqual([]);
    });
  });

  describe('when the path forks and two connections span the view', () => {
    const forked: PathInfo = {
      ...through,
      through: [
        { from: { title: 'Chapter 2', date: '2026-10-12' }, to: { title: 'Chapter 3', date: '2026-12-20' } },
        { from: { title: 'Chapter 2', date: '2026-10-12' }, to: { title: 'Side story', date: '2027-01-10' } },
      ],
    };

    it('draws one line for each, side by side on the lane of the path', () => {
      const lines = linesOf(worldOf({ paths: [forked] }));

      expect(lines).toHaveLength(2);
      expect(lines[0].from.y).not.toBe(lines[1].from.y);
    });

    it('carries today on each of them', () => {
      expect(buildScene(worldOf({ paths: [forked] }), calm).heres).toHaveLength(2);
    });
  });

  describe('when the path also has a point in the view', () => {
    it('still draws the line, beside the points of the path', () => {
      const point = { ...makePoint({ id: 'a', date: '2026-11-05' }), pathId: 'reading', x: 500, y: 0 } as PlacedPoint;

      const [line] = linesOf(worldOf({}, [point]));

      expect(line).toBeDefined();
      expect(line.from.y).not.toBe(point.y);
    });
  });

  describe('when the view does not cover today', () => {
    it('shows the line but no marker', () => {
      const scene = buildScene(worldOf({ today: '2026-12-25' }), calm);

      expect(scene.edges).toHaveLength(1);
      expect(scene.heres).toEqual([]);
    });
  });
});
