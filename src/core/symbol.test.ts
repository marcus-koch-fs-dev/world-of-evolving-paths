import { describe, expect, it } from 'vitest';
import { symbolSize } from './symbol';

describe('Symbol size', () => {
  describe('when comparing points', () => {
    it('makes a goal bigger than a milestone', () => {
      expect(symbolSize({ kind: 'goal' })).toBeGreaterThan(symbolSize({ kind: 'milestone' }));
    });

    it('makes a more important point bigger', () => {
      expect(symbolSize({ kind: 'milestone', importance: 5 })).toBeGreaterThan(
        symbolSize({ kind: 'milestone', importance: 2 }),
      );
    });

    it('treats a missing importance as 1', () => {
      expect(symbolSize({ kind: 'milestone' })).toBe(symbolSize({ kind: 'milestone', importance: 1 }));
    });
  });
});
