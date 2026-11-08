import { describe, expect, it } from 'vitest';
import { anyChange, type ConfigSnapshot, configDelta, needsLayout } from './configDelta.js';

const data = { paths: [] };
const snapshot: ConfigSnapshot = { raw: data, view: 'week', seed: 1, today: '2026-01-01', signature: 's' };
const same = { raw: data, view: 'week', seed: 1, today: '2026-01-01' };

describe('Config delta', () => {
  describe('when nothing differs', () => {
    it('reports no change', () => {
      const delta = configDelta(snapshot, same);

      expect(anyChange(delta)).toBe(false);
    });
  });

  describe('when only today differs', () => {
    it('reports today and needs no new layout', () => {
      const delta = configDelta(snapshot, { ...same, today: '2026-01-02' });

      expect(delta.todayChanged).toBe(true);
      expect(needsLayout(delta, false)).toBe(false);
    });
  });

  describe('when the data is another object', () => {
    it('reports the data as changed, but lays out only if the signature changed', () => {
      const delta = configDelta(snapshot, { ...same, raw: { paths: [] } });

      expect(delta.dataChanged).toBe(true);
      expect(needsLayout(delta, false)).toBe(false);
      expect(needsLayout(delta, true)).toBe(true);
    });
  });

  describe('when the view or the seed differs', () => {
    it('needs a new layout', () => {
      const view = configDelta(snapshot, { ...same, view: 'month' });
      const seed = configDelta(snapshot, { ...same, seed: 2 });

      expect(needsLayout(view, false)).toBe(true);
      expect(needsLayout(seed, false)).toBe(true);
    });
  });
});
