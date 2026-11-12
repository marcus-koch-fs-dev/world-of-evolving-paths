import { describe, expect, it } from 'vitest';
import { type Path, periodOf } from 'world-of-evolving-paths';
import { makePath, makePoint } from '../../tests/fixtures';
import { boundaryKey } from './connection';
import { lineEndAction } from './lineEndAction';
import type { BorderKeyOf } from './reach';

const withPoints = (id: string, points: ReturnType<typeof makePoint>[]): Path => ({
  ...makePath(id),
  points: points.map(({ pathId: _pathId, ...point }) => point),
});

const paths = [
  withPoints('combat', [makePoint({ id: 'a', next: ['b', 'x'] }), makePoint({ id: 'b' })]),
  withPoints('other', [makePoint({ id: 'x', pathId: 'other' })]),
];
const week = periodOf('week', '2026-11-04');
const offsets = { a: 10, b: -20, x: 5 };
const lead = (id?: string) => ({ id, title: 'T', date: '2026-12-01' });
const noEnds: never[] = [];
// The second branch of a point leads to `second`, every other line is the first branch
const branchOf: BorderKeyOf = (from, to, day) => boundaryKey(from, day, to === 'second' ? 1 : 0);
const ofEnd = (from: string, to: string, y = 40) => ({
  scope: 'end' as const,
  from: lead(from),
  to: lead(to),
  y,
  shift: 5,
  offsets,
  lineEnds: noEnds,
});

describe('Action for a dragged line', () => {
  describe('when the line itself was dragged', () => {
    const path = (shift: number, lineEnds: Parameters<typeof lineEndAction>[0]['lineEnds'] = noEnds) => ({
      scope: 'path' as const,
      pathId: 'combat',
      from: lead('a'),
      to: lead('b'),
      y: 0,
      shift,
      offsets,
      lineEnds,
    });

    it('moves every point of the path and leaves all other points where they are', () => {
      const action = lineEndAction(path(-30), week, paths, branchOf);

      expect(action).toMatchObject({ type: 'shiftPath', level: 'week', heights: { a: -20, b: -50, x: 5 } });
    });

    it('moves the line ends of the path at both borders, from the height they had', () => {
      const lineEnds = [
        { from: lead('b'), to: lead('far'), y: 20 },
        { from: lead('before'), to: lead('a'), y: -10 },
        { from: lead('x'), to: lead('elsewhere'), y: 99 },
      ];

      const action = lineEndAction(path(-30, lineEnds), week, paths, branchOf);

      expect(action).toMatchObject({
        boundaries: { [`b@${week.end}#0`]: -10, [`before@${week.start - 1}#0`]: -40 },
      });
    });

    it('moves the lines of a fork separately, one for each branch', () => {
      const lineEnds = [
        { from: lead('b'), to: lead('far'), y: 20 },
        { from: lead('b'), to: lead('second'), y: 60 },
      ];

      const action = lineEndAction(path(-10, lineEnds), week, paths, branchOf);

      expect(action).toMatchObject({ boundaries: { [`b@${week.end}#0`]: 10, [`b@${week.end}#1`]: 50 } });
    });

    it('does nothing for a path that is not in the view', () => {
      expect(lineEndAction({ ...path(5), pathId: 'gone' }, week, paths, branchOf)).toBeNull();
    });
  });

  describe('when the arrow at the end of a line was dragged', () => {
    it('keeps the height where the line leaves the period, and moves nothing else', () => {
      const action = lineEndAction(ofEnd('b', 'far'), week, paths, branchOf);

      expect(action).toEqual({ type: 'boundaryHeight', level: 'week', key: `b@${week.end}#0`, height: 40 });
    });

    it('keeps the height of the arrow of each branch of a fork apart', () => {
      const first = lineEndAction(ofEnd('b', 'far', 10), week, paths, branchOf);
      const second = lineEndAction(ofEnd('b', 'second', 90), week, paths, branchOf);

      expect(first).toMatchObject({ key: `b@${week.end}#0`, height: 10 });
      expect(second).toMatchObject({ key: `b@${week.end}#1`, height: 90 });
    });

    it('keeps the height where the line comes in', () => {
      const month = periodOf('month', '2026-11-04');

      const action = lineEndAction(ofEnd('far', 'a', -15), month, paths, branchOf);

      expect(action).toEqual({
        type: 'boundaryHeight',
        level: 'month',
        key: `far@${month.start - 1}#0`,
        height: -15,
      });
    });

    it('keeps the height at the border of the end that was taken, also for a line across the whole period', () => {
      const year = periodOf('year', '2026-11-04');

      const start = lineEndAction({ ...ofEnd('p', 'q', 33), side: 'before' }, year, paths, branchOf);
      const end = lineEndAction({ ...ofEnd('p', 'q', -8), side: 'after' }, year, paths, branchOf);

      expect(start).toEqual({ type: 'boundaryHeight', level: 'year', key: `p@${year.start - 1}#0`, height: 33 });
      expect(end).toEqual({ type: 'boundaryHeight', level: 'year', key: `p@${year.end}#0`, height: -8 });
    });
  });

  describe('when the view is an overview', () => {
    it('keeps nothing', () => {
      const several = periodOf('year', '2026-11-04', { years: 5 });

      expect(lineEndAction(ofEnd('a', 'p'), several, paths, branchOf)).toBeNull();
      expect(lineEndAction(ofEnd('a', 'p'), null, paths, branchOf)).toBeNull();
    });
  });
});
