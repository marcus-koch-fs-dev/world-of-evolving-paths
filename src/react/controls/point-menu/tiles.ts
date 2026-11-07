import type { TileId } from './types';

export const TILES: readonly { id: TileId; label: string; glyph: string }[] = [
  { id: 'status', label: 'Status', glyph: '✓' },
  { id: 'next', label: 'Next point', glyph: '+' },
  { id: 'kind', label: 'Kind', glyph: '▲' },
  { id: 'color', label: 'Path color', glyph: '●' },
  { id: 'rename', label: 'Name', glyph: 'Aa' },
  { id: 'details', label: 'Details', glyph: '≡' },
  { id: 'remove', label: 'Delete', glyph: '×' },
];
