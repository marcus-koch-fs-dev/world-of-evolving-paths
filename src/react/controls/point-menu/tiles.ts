import type { TileId } from './types.js';

export type Tile = { id: TileId; label: string; glyph: string; group: 'action' | 'property' };

// Things you do with a point come first, then the properties of the point.
export const TILES: readonly Tile[] = [
  { id: 'next', label: 'Next point', glyph: '+', group: 'action' },
  { id: 'connect', label: 'Connect', glyph: '⇢', group: 'action' },
  { id: 'remove', label: 'Delete', glyph: '×', group: 'action' },
  { id: 'status', label: 'Status', glyph: '✓', group: 'property' },
  { id: 'kind', label: 'Kind', glyph: '▲', group: 'property' },
  { id: 'rename', label: 'Name', glyph: 'Aa', group: 'property' },
  { id: 'color', label: 'Path color', glyph: '●', group: 'property' },
  { id: 'details', label: 'Details', glyph: '≡', group: 'property' },
];
