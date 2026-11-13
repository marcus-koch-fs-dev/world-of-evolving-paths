import { type CSSProperties, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { BarSlotContext } from '../../DockContext.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/iconData.js';
import { alignOf, edgeOf } from '../control-bar/dock.js';
import './tilePanel.css';

export type PanelTile = {
  id: string;
  label: string;
  /** An icon of the library. A tile that is switched on shows it solid. Wins over `glyph`. */
  icon?: IconName;
  /** What the tile shows large when there is no `icon`: a character or a small element. */
  glyph?: ReactNode;
  title?: string;
  /** Shown as switched on. */
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  /** Closes the panel after this tile was clicked, whatever `closeOnSelect` says. For a tile that opens something else. */
  closesPanel?: boolean;
  onClick: () => void;
};

export type PanelGroup = {
  id: string;
  label: string;
  tiles: readonly PanelTile[];
  /** A color (any CSS color) that tints the background of the tiles of this group a little. */
  tint?: string;
};

export type TilePanelProps = {
  groups: readonly PanelGroup[];
  /** Name of the button that opens the panel. Default `Menu`. */
  label?: string;
  /** What the button shows. Default: the menu icon. */
  glyph?: ReactNode;
  /** `tiles` (default) is a grid of keys, `list` is one row per tile, easier on a narrow screen. */
  variant?: 'tiles' | 'list';
  /** Show the group names and the names under the tiles. Default true. Without them only icons show, with the name as hover text. */
  labels?: boolean;
  /** A small count on the button, for example how many things are still open. Not shown when 0 or missing. */
  badge?: number;
  /** Close the panel after a tile was clicked. Default false: it stays open until the button or Escape closes it. */
  closeOnSelect?: boolean;
};

/**
 * A button that opens a small panel of tiles in groups, like the keys of a number pad. It opens away from the edge
 * its `ControlBar` is docked at. It stays open until the button is clicked again or Escape is pressed.
 * The app decides which tiles there are and what they do.
 */
export function TilePanel({
  groups,
  label = 'Menu',
  glyph = <Icon name="menu" />,
  variant = 'tiles',
  labels = true,
  closeOnSelect = false,
  badge,
}: TilePanelProps) {
  const slot = useContext(BarSlotContext);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // A tap anywhere outside the button and the panel closes it
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="pw-tile-panel-wrap" ref={wrap} style={{ display: 'contents' }}>
      <button
        type="button"
        className={`pw-button pw-tile-panel-button${open ? ' is-active' : ''}`}
        aria-label={badge ? `${label}, ${badge}` : label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        {glyph}
        {badge ? <span className="pw-tp-badge">{badge}</span> : null}
      </button>
      {open && (
        <div
          className={`pw-tile-panel${variant === 'list' ? ' is-list' : ''}${labels ? '' : ' is-bare'} pw-tp-${edgeOf(slot) === 'top' ? 'down' : 'up'} pw-tp-${alignOf(slot) === 'right' ? 'end' : 'start'}`}
        >
          {groups.map((group) => (
            <section
              key={group.id}
              className="pw-tp-group"
              style={group.tint ? ({ '--pw-tp-tint': group.tint } as CSSProperties) : undefined}
            >
              {labels && <h4>{group.label}</h4>}
              <div className="pw-tp-tiles">
                {group.tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    className={`pw-tp-tile${tile.active ? ' is-on' : ''}${tile.danger ? ' is-danger' : ''}`}
                    title={tile.title ?? tile.label}
                    aria-label={tile.label}
                    disabled={tile.disabled}
                    onClick={() => {
                      tile.onClick();
                      if (closeOnSelect || tile.closesPanel) setOpen(false);
                    }}
                  >
                    <span className="pw-tp-glyph">
                      {tile.icon ? <Icon name={tile.icon} weight={tile.active ? 'fill' : 'regular'} /> : tile.glyph}
                    </span>
                    {labels && <span className="pw-tp-label">{tile.label}</span>}
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
