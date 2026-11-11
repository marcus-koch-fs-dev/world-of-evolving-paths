import { describe, expect, it } from 'vitest';
import { periodOf } from 'world-of-evolving-paths';
import { makePoint } from '../../tests/fixtures';
import { throughConnections } from './throughPaths';

const november = periodOf('month', '2026-11-11');
const everything = () => true;

describe('Connections that span a period', () => {
  describe('when a connection runs from before the period to after it', () => {
    const points = [
      makePoint({ id: 'before', pathId: 'a', date: '2026-10-12', title: 'Before', next: ['after'] }),
      makePoint({ id: 'after', pathId: 'a', date: '2026-12-20', title: 'After' }),
    ];

    it('spans it, with both ends', () => {
      const found = throughConnections(points, november, everything).get('a');

      expect(found).toEqual([
        {
          from: { title: 'Before', date: '2026-10-12', id: 'before' },
          to: { title: 'After', date: '2026-12-20', id: 'after' },
        },
      ]);
    });
  });

  describe('when the path forks before the period', () => {
    const points = [
      makePoint({ id: 'fork', pathId: 'a', date: '2026-09-07', next: ['main', 'branch'] }),
      makePoint({ id: 'main', pathId: 'a', date: '2026-12-28' }),
      makePoint({ id: 'branch', pathId: 'a', date: '2026-12-20' }),
    ];

    it('has one connection for each branch, the earlier end first', () => {
      const found = throughConnections(points, november, everything).get('a');

      expect(found?.map((through) => through.to.id)).toEqual(['branch', 'main']);
    });
  });

  describe('when points in between are hidden by the view', () => {
    const points = [
      makePoint({ id: 'a1', pathId: 'a', date: '2026-10-01', importance: 3, next: ['hidden'] }),
      makePoint({ id: 'hidden', pathId: 'a', date: '2026-11-10', importance: 1, next: ['a2'] }),
      makePoint({ id: 'a2', pathId: 'a', date: '2026-12-20', importance: 3 }),
    ];

    it('runs across them', () => {
      const shown = (point: (typeof points)[number]) => (point.importance ?? 1) >= 2;

      const found = throughConnections(points, november, shown).get('a');

      expect(found?.[0].from.id).toBe('a1');
      expect(found?.[0].to.id).toBe('a2');
    });
  });

  describe('when a shown point lies in the period', () => {
    it('is no connection that spans it, the point has its own lines', () => {
      const points = [
        makePoint({ id: 'a1', pathId: 'a', date: '2026-10-01', next: ['a2'] }),
        makePoint({ id: 'a2', pathId: 'a', date: '2026-11-10', next: ['a3'] }),
        makePoint({ id: 'a3', pathId: 'a', date: '2026-12-20' }),
      ];

      expect(throughConnections(points, november, everything).size).toBe(0);
    });
  });

  describe('when a path has ended before the period or begins after it', () => {
    it('has none', () => {
      const ended = [makePoint({ id: 'p', pathId: 'a', date: '2026-10-12' })];
      const later = [makePoint({ id: 'p', pathId: 'a', date: '2026-12-20' })];

      expect(throughConnections(ended, november, everything).size).toBe(0);
      expect(throughConnections(later, november, everything).size).toBe(0);
    });
  });

  describe('in a free view', () => {
    it('has none', () => {
      expect(throughConnections([makePoint({ id: 'p', pathId: 'a' })], null, everything).size).toBe(0);
    });
  });
});
