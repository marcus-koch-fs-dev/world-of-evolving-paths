import { describe, expect, it, vi } from 'vitest';
import { createBoundedCache } from './boundedCache.js';

describe('Bounded cache', () => {
  describe('when a key is asked for twice', () => {
    it('makes the value once', () => {
      const cache = createBoundedCache<string>(3);
      const make = vi.fn(() => 'value');

      cache.get('a', make);
      const second = cache.get('a', make);

      expect(second).toBe('value');
      expect(make).toHaveBeenCalledTimes(1);
    });
  });

  describe('when more keys come than the limit', () => {
    it('drops the one used least recently and keeps the size at the limit', () => {
      const cache = createBoundedCache<number>(2);
      const make = vi.fn(() => 1);

      cache.get('a', make);
      cache.get('b', make);
      cache.get('a', make); // a is used again, so b is now the oldest
      cache.get('c', make);
      cache.get('a', make);

      expect(cache.size()).toBe(2);
      expect(make).toHaveBeenCalledTimes(3);
    });
  });
});
