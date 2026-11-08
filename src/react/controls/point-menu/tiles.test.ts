import { describe, expect, it } from 'vitest';
import { TILES, visibleTiles } from './tiles.js';

const ids = (tiles: readonly { id: string }[]) => tiles.map((tile) => tile.id);

describe('Visible tiles', () => {
  describe('when the app cannot connect', () => {
    it('leaves the connect tile out', () => {
      const tiles = visibleTiles(TILES, undefined, false);

      expect(ids(tiles)).not.toContain('connect');
      expect(tiles).toHaveLength(TILES.length - 1);
    });
  });

  describe('when the app can connect', () => {
    it('shows every tile', () => {
      const tiles = visibleTiles(TILES, undefined, true);

      expect(tiles).toHaveLength(TILES.length);
    });
  });

  describe('when tiles are hidden', () => {
    it('leaves exactly those out', () => {
      const tiles = visibleTiles(TILES, ['remove', 'color'], true);

      expect(ids(tiles)).not.toContain('remove');
      expect(ids(tiles)).not.toContain('color');
      expect(tiles).toHaveLength(TILES.length - 2);
    });
  });
});
