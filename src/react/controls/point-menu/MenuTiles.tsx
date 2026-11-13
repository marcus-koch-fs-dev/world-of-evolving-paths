import type { Tile } from './tiles.js';
import type { TileId } from './types.js';

type Props = {
  tiles: readonly Tile[];
  open: TileId | null;
  /** Color of the path, shown on the color tile. */
  pathColor: string;
  onToggle: (id: TileId) => void;
};

const GROUPS: { group: Tile['group']; label: string }[] = [
  { group: 'action', label: 'Actions' },
  { group: 'property', label: 'Properties' },
];

/** The tiles of the menu in two groups: what you do with the point, and what the point is. */
export function MenuTiles({ tiles, open, pathColor, onToggle }: Props) {
  return (
    <>
      {GROUPS.map(({ group, label }) => {
        const inGroup = tiles.filter((tile) => tile.group === group);
        if (inGroup.length === 0) return null;
        return (
          <section key={group} className="pw-menu-group">
            <h4>{label}</h4>
            <div className="pw-menu-tiles">
              {inGroup.map((tile) => (
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
          </section>
        );
      })}
    </>
  );
}
