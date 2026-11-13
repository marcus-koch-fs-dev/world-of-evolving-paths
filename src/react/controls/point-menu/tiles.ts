import type { TileId } from './types.js';

/** The tiles to show: all of them without the hidden ones. */
export function visibleTiles(tiles: readonly Tile[], hide: readonly TileId[] | undefined): readonly Tile[] {
  return tiles.filter((tile) => !hide?.includes(tile.id));
}

export type Tile = { id: TileId; label: string; glyph: string };

// A keypad of four keys in two rows: what you do with the point first, then what the point is, then the turn.
export const TILES: readonly Tile[] = [
  { id: 'next', label: 'Next point', glyph: '+' },
  { id: 'remove', label: 'Delete', glyph: '×' },
  { id: 'status', label: 'Status', glyph: '✓' },
  { id: 'kind', label: 'Kind', glyph: '▲' },
  { id: 'rename', label: 'Name', glyph: 'Aa' },
  { id: 'color', label: 'Path color', glyph: '●' },
  { id: 'details', label: 'Details', glyph: '≡' },
  { id: 'turn', label: 'Turn', glyph: '↻' },
];
