import { describe, expect, it } from 'vitest';
import { placedPoint, worldOf } from '../../../tests/fixtures';
import { buildScene } from './buildScene';
import type { SceneState } from './types';

const calm: SceneState = { wave: false, hovered: null, dragging: null, locale: 'de' };

describe('Scene appearance', () => {
  describe('when a point has been reached over a strong path', () => {
    it('gets a thicker outline than one over a weak path', () => {
      const world = worldOf([
        placedPoint({ id: 'weak', status: 'done', strength: 0 }, 0),
        placedPoint({ id: 'strong', status: 'done', strength: 4 }, 300),
      ]);

      const [weak, strong] = buildScene(world, calm).nodes;

      expect(strong.outlineWidth).toBeGreaterThan(weak.outlineWidth);
    });

    it('keeps the thin outline for a point that is not reached yet', () => {
      const world = worldOf([
        placedPoint({ id: 'open', status: 'open', strength: 4 }, 0),
        placedPoint({ id: 'plain', status: 'open' }, 300),
      ]);

      const [open, plain] = buildScene(world, calm).nodes;

      expect(open.outlineWidth).toBe(plain.outlineWidth);
    });
  });

  describe('when a point is dragged', () => {
    const world = worldOf([placedPoint({ id: 'a' }, 0), placedPoint({ id: 'b' }, 90), placedPoint({ id: 'far' }, 900)]);

    it('shows a ring around it and around the points close by', () => {
      const { rings } = buildScene(world, { ...calm, dragging: 'a' });

      expect(rings.map((ring) => ring.id).sort()).toEqual(['a', 'b']);
      expect(rings.find((ring) => ring.id === 'a')?.dragged).toBe(true);
    });

    it('shows no rings otherwise', () => {
      expect(buildScene(world, calm).rings).toEqual([]);
    });
  });

  describe('when writing the date under a point', () => {
    const world = worldOf([placedPoint({ id: 'a', date: '2026-11-02' }, 0)], '2026-11-10');

    it('uses the language and leaves out the current year', () => {
      expect(buildScene(world, calm).nodes[0].date).toBe('2.11.');
    });

    it('lets the app write the date itself', () => {
      const [node] = buildScene(world, { ...calm, formatDate: (iso) => `on ${iso}` }).nodes;

      expect(node.date).toBe('on 2026-11-02');
    });
  });
});
