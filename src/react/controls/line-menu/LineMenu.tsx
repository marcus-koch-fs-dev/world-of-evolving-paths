import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Position } from '../../../core/index.js';
import { useWorldVersion } from '../../hooks/useWorldVersion.js';
import { usePathWorldHandle } from '../../PathWorldContext.js';
import { resolvePlacement } from '../point-menu/placement.js';
import '../point-menu/pointMenu.css';

const OFFSET = 18; // world units between the click and the menu

export type LineMenuTile = {
  id: string;
  label: string;
  /** What the tile shows large: a character or a small element. */
  glyph: ReactNode;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
};

export type LineMenuProps = {
  /** Where the user clicked: `at` of the `onLineSelect` event. The menu sits there and moves with the camera. */
  at: Position;
  /** What the line is, for example `Gym → Muscle-up`. */
  title: string;
  /** A second, quieter line, for example the date at the click. */
  subtitle?: string;
  tiles: readonly LineMenuTile[];
};

/**
 * Tile menu next to a line that was clicked, in the look of the `PointMenu`. It sits on the map's overlay, so it
 * keeps its size when zooming. Place it inside `<PathWorld>` while a line is selected, and remove it when
 * `onSelect(null)` comes (a click on the empty area).
 */
export function LineMenu({ at, title, subtitle, tiles }: LineMenuProps) {
  const handle = usePathWorldHandle();
  useWorldVersion(handle);
  const camera = handle.getCamera();
  const room = handle.overlay.parentElement?.clientHeight ?? Number.POSITIVE_INFINITY;
  const placement = resolvePlacement('auto', at.y * camera.zoom + camera.y, room);
  const top = placement === 'above' ? at.y - OFFSET : at.y + OFFSET;

  return createPortal(
    <div className={`pw-point-menu pw-menu-${placement}`} data-pw-ui style={{ left: at.x, top }}>
      <div className="pw-menu-grid">
        <div className="pw-menu-title">
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
        <div className="pw-menu-tiles">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`pw-tile${tile.danger ? ' is-danger' : ''}`}
              title={tile.title ?? tile.label}
              aria-label={tile.label}
              disabled={tile.disabled}
              onClick={tile.onClick}
            >
              <span className="pw-glyph">{tile.glyph}</span>
              <span className="pw-tile-label">{tile.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    handle.overlay,
  );
}
