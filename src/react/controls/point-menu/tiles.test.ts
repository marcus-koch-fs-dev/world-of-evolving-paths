import { describe, expect, it } from 'vitest';
import { TILES, visibleTiles } from './tiles.js';

const ids = (tiles: readonly { id: string }[]) => tiles.map((tile) => tile.id);

describe('Visible tiles', () => {
  describe('when nothing is hidden', () => {
    it('shows every tile', () => {
      const tiles = visibleTiles(TILES, undefined);

      expect(tiles).toHaveLength(TILES.length);
    });
  });

  describe('when tiles are hidden', () => {
    it('leaves exactly those out', () => {
      const tiles = visibleTiles(TILES, ['remove', 'color']);

      expect(ids(tiles)).not.toContain('remove');
      expect(ids(tiles)).not.toContain('color');
      expect(tiles).toHaveLength(TILES.length - 2);
    });
  });
});
