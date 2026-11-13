import type { Tile } from './tiles.js';
import type { TileId } from './types.js';

type Props = {
  tiles: readonly Tile[];
  open: TileId | null;
  /** Color of the path, shown on the color tile. */
  pathColor: string;
  onToggle: (id: TileId) => void;
};

/** The tiles of the menu as one keypad. */
export function MenuTiles({ tiles, open, pathColor, onToggle }: Props) {
  return (
    <div className="pw-menu-tiles">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          className={`pw-tile${open === tile.id ? ' is-open' : ''}${tile.id === 'remove' ? ' is-danger' : ''}`}
          title={tile.label}
          aria-label={tile.label}
          onClick={() => onToggle(tile.id)}
        >
          <span className="pw-glyph" style={tile.id === 'color' ? { color: pathColor } : undefined}>
            {tile.glyph}
          </span>
          <span className="pw-tile-label">{tile.label}</span>
        </button>
      ))}
    </div>
  );
}
