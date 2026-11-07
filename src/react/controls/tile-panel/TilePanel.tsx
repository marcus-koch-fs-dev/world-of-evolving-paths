import { type ReactNode, useContext, useEffect, useState } from 'react';
import { BarSlotContext } from '../../DockContext.js';
import { alignOf, edgeOf } from '../control-bar/dock.js';
import './tilePanel.css';

export type PanelTile = {
  id: string;
  label: string;
  /** What the tile shows large: a character or a small element. */
  glyph: ReactNode;
  title?: string;
  /** Shown as switched on. */
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
};

export type PanelGroup = { id: string; label: string; tiles: readonly PanelTile[] };

export type TilePanelProps = {
  groups: readonly PanelGroup[];
  /** Name of the button that opens the panel. Default `Menu`. */
  label?: string;
  /** What the button shows. Default `▦`. */
  glyph?: ReactNode;
};

/**
 * A button that opens a small panel of tiles in groups, like the keys of a number pad. It opens away from the edge
 * its `ControlBar` is docked at. It stays open until the button is clicked again or Escape is pressed.
 * The app decides which tiles there are and what they do.
 */
export function TilePanel({ groups, label = 'Menu', glyph = '▦' }: TilePanelProps) {
  const slot = useContext(BarSlotContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="pw-tile-panel-wrap" style={{ display: 'contents' }}>
      <button
        type="button"
        className={`pw-button pw-tile-panel-button${open ? ' is-active' : ''}`}
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        {glyph}
      </button>
      {open && (
        <div
          className={`pw-tile-panel pw-tp-${edgeOf(slot) === 'top' ? 'down' : 'up'} pw-tp-${alignOf(slot) === 'right' ? 'end' : 'start'}`}
        >
          {groups.map((group) => (
            <section key={group.id} className="pw-tp-group">
              <h4>{group.label}</h4>
              <div className="pw-tp-tiles">
                {group.tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    className={`pw-tp-tile${tile.active ? ' is-on' : ''}${tile.danger ? ' is-danger' : ''}`}
                    title={tile.title}
                    disabled={tile.disabled}
                    onClick={tile.onClick}
                  >
                    <span className="pw-tp-glyph">{tile.glyph}</span>
                    <span className="pw-tp-label">{tile.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
