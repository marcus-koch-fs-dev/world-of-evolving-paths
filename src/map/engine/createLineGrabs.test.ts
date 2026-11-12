import { describe, expect, it } from 'vitest';
import { pathIdOfKey, pathKeyOf } from './createLineGrabs.js';

describe('Keys of line drags', () => {
  describe('when a whole path is dragged', () => {
    it('gives back the id of the path', () => {
      expect(pathIdOfKey(pathKeyOf('gym'))).toBe('gym');
    });
  });

  describe('when an arrow is dragged', () => {
    it('is not taken for a path, even if the path id starts with "path:"', () => {
      const arrowKey = 'path:fitness/main@2026-11-09';

      expect(pathIdOfKey(arrowKey)).toBeNull();
    });

    it('is not taken for a path when the id does not look like one', () => {
      expect(pathIdOfKey('gym/main@2026-11-09')).toBeNull();
    });
  });

  describe('when the id of a path starts with "path:"', () => {
    it('still works as a path drag', () => {
      expect(pathIdOfKey(pathKeyOf('path:fitness'))).toBe('path:fitness');
    });
  });
});
