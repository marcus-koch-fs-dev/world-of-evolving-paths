import { describe, expect, it } from 'vitest';
import { buildLevel } from './buildLevel.js';
import { createStoreCache } from './cache.js';
import { createStore } from './levels.js';
import type { Branch, StorePath, StorePoint } from './types.js';
import { validateStore } from './validate.js';

const point = (id: string, date: string, prio = 3): StorePoint => ({
  id,
  date,
  title: id,
  kind: 'milestone',
  status: 'open',
  prio,
});

const branch = (id: string, points: StorePoint[], splitsAt?: string): Branch => ({ id, points, splitsAt });

const path = (id: string, branches: Branch[]): StorePath => ({ id, name: id, color: '#3a86ff', branches });

const parent = path('a', [branch('a-main', [point('a1', '2026-11-02'), point('a2', '2026-11-20')])]);
const fork = path('b', [branch('b-fork', [point('b1', '2026-11-10')], 'a1')]);

const firstItemOf = (chains: { items: { point: { id: string }; role: string }[] }[]) => chains[0]?.items[0];

describe('Forks and the cache', () => {
  describe('when the path a fork leaves from is added after the fork', () => {
    it('gives the fork its anchor once the parent is there', () => {
      const cache = createStoreCache();
      const alone = [fork];
      const together = [parent, fork];

      cache.view(alone).chainsOf(fork, 'week');
      const chains = cache.view(together).chainsOf(fork, 'week');

      expect(firstItemOf(chains)).toMatchObject({ role: 'anchor', point: { id: 'a1' } });
    });

    it('shows the anchor in a built level', () => {
      const cache = createStoreCache();
      const span = { start: 0, end: 100000 };
      buildLevel(createStore([fork]), 'week', span, { view: cache.view([fork]) });

      const built = buildLevel(createStore([parent, fork]), 'week', span, { view: cache.view([parent, fork]) });

      const elements = built.find((shown) => shown.id === 'b')?.branches[0].elements ?? [];
      expect(elements.map((element) => element.type)).toContain('anchor');
    });
  });

  describe('when the path a fork leaves from is the same as last time', () => {
    it('gives back the remembered lines', () => {
      const cache = createStoreCache();
      const paths = [parent, fork];
      const first = cache.view(paths).chainsOf(fork, 'week');

      const second = cache.view(paths).chainsOf(fork, 'week');

      expect(second).toBe(first);
    });
  });
});

describe('Checking the points of a fork', () => {
  describe('when a fork has a point before the point it splits at', () => {
    it('says so', () => {
      const early = path('b', [branch('b-fork', [point('b1', '2026-11-01')], 'a2')]);

      const problems = validateStore([parent, early]);

      expect(problems).toEqual(['Branch "b-fork" has a point before the point it splits at.']);
    });
  });

  describe('when a fork has a point on the same day as the point it splits at', () => {
    it('finds nothing wrong, whatever the ids are', () => {
      const sameDay = path('b', [branch('b-fork', [point('a0', '2026-11-20')], 'a2')]);

      expect(validateStore([parent, sameDay])).toEqual([]);
    });
  });

  describe('when every point of a fork comes after the point it splits at', () => {
    it('finds nothing wrong', () => {
      expect(validateStore([parent, fork])).toEqual([]);
    });
  });
});
