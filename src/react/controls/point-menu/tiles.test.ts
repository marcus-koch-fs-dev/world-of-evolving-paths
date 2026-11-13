import { describe, expect, it } from 'vitest';
import { TILES, visibleTiles } from './tiles.js';

const ids = (tiles: readonly { id: string }[]) => tiles.map((tile) => tile.id);

describe('Tiles of the keypad', () => {
  it('fill two rows of four keys, with the turn last', () => {
    expect(TILES).toHaveLength(8);
    expect(ids(TILES).at(-1)).toBe('turn');
  });
});

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
