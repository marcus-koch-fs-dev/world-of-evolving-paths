import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../../tests/fixtures.js';
import { toDay } from '../dates.js';
import type { PathInfo, PlacedPoint, PlacedWorld } from '../types.js';
import { LINE_GAP } from './lineGeometry.js';
import { laneOfTrack, lineTracks, separateTracks, type Track } from './tracks.js';

const track = (key: string, y: number, x0 = 0, x1 = 1000, fixed = false): Track => ({ key, x0, x1, y, fixed });

describe('Tracks of lines along the time axis', () => {
  describe('when two lines cover the same stretch of time at nearly the same height', () => {
    it('keeps them apart by the least gap', () => {
      const found = separateTracks([track('a', 100), track('b', 110)]);

      expect(Math.abs((found.get('b') ?? 0) - (found.get('a') ?? 0))).toBeGreaterThanOrEqual(LINE_GAP);
    });
  });

  describe('when lines lie in different stretches of time', () => {
    it('leaves them where they are, even at the same height', () => {
      const found = separateTracks([track('a', 100, 0, 400), track('b', 100, 500, 900)]);

      expect(found.get('a')).toBe(100);
      expect(found.get('b')).toBe(100);
    });
  });

  describe('when a line spans the whole view', () => {
    it('keeps its height, and the others make room', () => {
      const found = separateTracks([track('lead', 100), track('across', 100, 0, 1000, true)]);

      expect(found.get('across')).toBe(100);
      expect(found.get('lead')).toBe(100 + LINE_GAP);
    });
  });

  describe('when the user put a line at a height', () => {
    it('keeps it there, and the others make room', () => {
      const found = separateTracks([track('other', 100), { ...track('chosen', 100), exact: true }]);

      expect(found.get('chosen')).toBe(100);
      expect(found.get('other')).toBe(100 + LINE_GAP);
    });

    it('keeps it even next to a line that spans the whole view', () => {
      const found = separateTracks([track('across', 100, 0, 1000, true), { ...track('chosen', 110), exact: true }]);

      expect(found.get('chosen')).toBe(110);
    });

    it('moves the second of two such lines that lie on top of each other', () => {
      const found = separateTracks([
        { ...track('first', 100), exact: true },
        { ...track('second', 100), exact: true },
      ]);

      expect(found.get('first')).toBe(100);
      expect(found.get('second')).toBe(100 + LINE_GAP);
    });
  });

  describe('when three lines pile up', () => {
    it('puts each on a track of its own', () => {
      const found = separateTracks([track('a', 100), track('b', 100), track('c', 100)]);

      expect(new Set(found.values()).size).toBe(3);
    });
  });

  describe('when the same input comes again', () => {
    it('gives the same result, whatever the order of the lines', () => {
      const lines = [track('a', 100), track('b', 100), track('c', 100)];

      expect(separateTracks([...lines].reverse())).toEqual(separateTracks(lines));
    });
  });
});

describe('Tracks of a world', () => {
  const november = { start: toDay('2026-11-01'), end: toDay('2026-11-30') };
  const path = (id: string, throughs: number): PathInfo => ({
    ...makePath(id, '#ff3b3b', 0),
    through: Array.from({ length: throughs }, () => ({
      from: { title: 'Before', date: '2026-10-12' },
      to: { title: 'After', date: '2026-12-20' },
    })),
  });
  const world = (paths: PathInfo[], points: PlacedPoint[] = []): PlacedWorld => ({
    today: '2026-11-11',
    period: november,
    paths,
    points,
  });

  it('spreads the lines of a fork that span the view by the least gap', () => {
    const tracks = lineTracks(world([path('gym', 3)]));

    const ys = ['through:gym:0', 'through:gym:1', 'through:gym:2'].map((key) => tracks.get(key) ?? 0).sort();
    expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(LINE_GAP);
    expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(LINE_GAP);
  });

  it('moves a line that leaves a point away from a line that spans the view at the same height', () => {
    const point = {
      ...makePoint({ id: 'p', pathId: 'gym', date: '2026-11-10', outgoing: [{ title: 'Out', date: '2026-12-20' }] }),
      x: 500,
      y: 0,
    } as PlacedPoint;

    const tracks = lineTracks(world([path('gym', 1)], [point]));

    const across = tracks.get('through:gym:0') ?? 0;
    const leaving = tracks.get('lead:after:p:0') ?? 0;
    expect(Math.abs(leaving - across)).toBeGreaterThanOrEqual(LINE_GAP);
  });

  it('puts a line at the height the data holds for it', () => {
    const kept: PathInfo = {
      ...makePath('gym', '#ff3b3b', 0),
      through: [{ from: { title: 'Before', date: '2026-10-12' }, to: { title: 'After', date: '2026-12-20' }, y: 333 }],
    };

    expect(lineTracks(world([kept])).get('through:gym:0')).toBe(333);
  });

  it('reads the height in the data as a distance from the lane of the path', () => {
    const kept: PathInfo = {
      ...makePath('read', '#3a86ff', 1),
      through: [{ from: { title: 'Before', date: '2026-10-12' }, to: { title: 'After', date: '2026-12-20' }, y: 30 }],
    };
    const both = world([makePath('gym', '#ff3b3b', 0), kept]);

    expect(lineTracks(both).get('through:read:0')).toBe(laneOfTrack(both, 'through:read:0') + 30);
    expect(laneOfTrack(both, 'through:read:0')).toBe(100);
  });

  it('finds the lane of a line that leaves a point by the path of the point', () => {
    const point = { ...makePoint({ id: 'a:b', pathId: 'gym', date: '2026-11-10' }), x: 0, y: 0 } as PlacedPoint;
    const both = world([makePath('gym', '#ff3b3b', 0), makePath('read', '#3a86ff', 1)], [point]);

    expect(laneOfTrack(both, 'lead:after:a:b:0')).toBe(-100);
  });

  it('puts a line at the height the user is dragging it to, before the data holds it', () => {
    const tracks = lineTracks(world([path('gym', 1)]), new Map([['through:gym:0', -120]]));

    expect(tracks.get('through:gym:0')).toBe(-120);
  });

  it('has no tracks in a free view', () => {
    expect(lineTracks({ ...world([path('gym', 1)]), period: null }).size).toBe(0);
  });
});
