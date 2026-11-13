import type { Tile } from './tiles.js';
import type { TileId } from './types.js';

type Props = {
  tiles: readonly Tile[];
  open: TileId | null;
  /** Color of the path, shown on the color tile. */
  pathColor: string;
  /** The path is checked in today: the check-in key shows it and cannot be pressed again. */
  checkedIn: boolean;
  onToggle: (id: TileId) => void;
};

/** The tiles of the menu as one keypad. */
export function MenuTiles({ tiles, open, pathColor, checkedIn, onToggle }: Props) {
  return (
    <div className="pw-menu-tiles">
      {tiles.map((tile) => {
        const done = tile.id === 'checkin' && checkedIn;
        const label = done ? 'Checked in' : tile.label;
        return (
          <button
            key={tile.id}
            type="button"
            className={`pw-tile${open === tile.id || done ? ' is-open' : ''}${tile.id === 'remove' ? ' is-danger' : ''}`}
            title={label}
            aria-label={label}
            disabled={done}
            onClick={() => onToggle(tile.id)}
          >
            <span className="pw-glyph" style={tile.id === 'color' ? { color: pathColor } : undefined}>
              {tile.glyph}
            </span>
            <span className="pw-tile-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
