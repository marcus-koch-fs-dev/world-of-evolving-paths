import { describe, expect, it } from 'vitest';
import { periodOf, toDay } from 'world-of-evolving-paths';
import { makePoint } from '../../tests/fixtures';
import { createLeadFinder } from './leads';
import type { DemoPoint } from './types';

const february = periodOf('month', '2026-02-10');
const inFebruary = (point: DemoPoint) => {
  const day = toDay(point.date);
  return day >= february.start && day <= february.end;
};

const find = (all: DemoPoint[], shownIds: string[], inPeriod = inFebruary) =>
  createLeadFinder(all, new Set(shownIds), inPeriod);

describe('Leads of a view', () => {
  describe('when a path starts before the period and goes on after it', () => {
    const all = [
      makePoint({ id: 'before', title: '5 pull-ups', date: '2026-01-20', next: ['a'] }),
      makePoint({ id: 'a', title: 'First pull-up', date: '2026-02-09', next: ['after'] }),
      makePoint({ id: 'after', title: '10 pull-ups', date: '2026-03-23' }),
    ];

    it('tells where it comes from and where it goes, with title and date', () => {
      const leads = find(all, ['a'])(all[1]);

      expect(leads.incoming).toEqual([{ title: '5 pull-ups', date: '2026-01-20' }]);
      expect(leads.outgoing).toEqual([{ title: '10 pull-ups', date: '2026-03-23' }]);
    });
  });

  describe('when two points of the view follow each other', () => {
    it('gives the first no outgoing and the second no incoming, the line between them is enough', () => {
      const all = [makePoint({ id: 'a', date: '2026-02-02', next: ['b'] }), makePoint({ id: 'b', date: '2026-02-20' })];
      const leadsOf = find(all, ['a', 'b']);

      expect(leadsOf(all[0])).toEqual({});
      expect(leadsOf(all[1])).toEqual({});
    });
  });

  describe('when a hidden point of the period lies between two shown points', () => {
    it('gives nothing, because the connection runs across it', () => {
      const all = [
        makePoint({ id: 'a', date: '2026-02-02', next: ['hidden'] }),
        makePoint({ id: 'hidden', date: '2026-02-10', next: ['b'] }),
        makePoint({ id: 'b', date: '2026-02-20' }),
      ];
      const leadsOf = find(all, ['a', 'b']);

      expect(leadsOf(all[0])).toEqual({});
      expect(leadsOf(all[2])).toEqual({});
    });
  });

  describe('when a chain of hidden points leaves the period', () => {
    it('names the first point outside, not the hidden ones', () => {
      const all = [
        makePoint({ id: 'a', date: '2026-02-02', next: ['hidden'] }),
        makePoint({ id: 'hidden', title: 'Hidden', date: '2026-02-24', next: ['out'] }),
        makePoint({ id: 'out', title: 'March', date: '2026-03-05', next: ['far'] }),
        makePoint({ id: 'far', title: 'May', date: '2026-05-05' }),
      ];

      expect(find(all, ['a'])(all[0]).outgoing).toEqual([{ title: 'March', date: '2026-03-05' }]);
    });
  });

  describe('when a path forks and one branch leaves the period', () => {
    it('gives a lead only for the branch that leaves', () => {
      const all = [
        makePoint({ id: 'a', date: '2026-02-02', next: ['b', 'out'] }),
        makePoint({ id: 'b', date: '2026-02-20' }),
        makePoint({ id: 'out', title: 'Later', date: '2026-04-01' }),
      ];

      expect(find(all, ['a', 'b'])(all[0]).outgoing).toEqual([{ title: 'Later', date: '2026-04-01' }]);
    });

    it('lists several leads oldest first and once each', () => {
      const all = [
        makePoint({ id: 'a', date: '2026-02-02', next: ['x', 'y', 'z'] }),
        makePoint({ id: 'x', title: 'X', date: '2026-05-01' }),
        makePoint({ id: 'y', title: 'Y', date: '2026-04-01' }),
        makePoint({ id: 'z', title: 'Y', date: '2026-04-01' }),
      ];

      const titles = find(all, ['a'])(all[0]).outgoing?.map((lead) => lead.title);

      expect(titles).toEqual(['Y', 'X']);
    });
  });

  describe('when there is no period, as in the free view', () => {
    it('gives nothing, because every point is inside', () => {
      const all = [makePoint({ id: 'a', date: '2026-02-02', next: ['b'] }), makePoint({ id: 'b', date: '2026-08-20' })];

      expect(find(all, ['a'], () => true)(all[0])).toEqual({});
    });
  });

  describe('when the data has a circle', () => {
    it('does not run forever', () => {
      const all = [
        makePoint({ id: 'a', date: '2026-02-02', next: ['loop'] }),
        makePoint({ id: 'loop', date: '2026-02-10', next: ['a'] }),
      ];

      expect(find(all, ['a'])(all[0])).toEqual({});
    });
  });
});
