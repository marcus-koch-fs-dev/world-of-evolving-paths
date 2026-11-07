import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PATH_PALETTE, type Path, type PathPoint } from '../../../core';
import { useWorldVersion } from '../../hooks/useWorldVersion';
import { usePathWorldHandle } from '../../PathWorldContext';
import { ColorPanel } from './panels/ColorPanel';
import { DeletePanel } from './panels/DeletePanel';
import { DetailsPanel } from './panels/DetailsPanel';
import { KindPanel } from './panels/KindPanel';
import { NextPointPanel } from './panels/NextPointPanel';
import { RenamePanel } from './panels/RenamePanel';
import { STATUS_LABELS, StatusPanel } from './panels/StatusPanel';
import './pointMenu.css';
import { TILES } from './tiles';
import type { NextPointInput, PointPatch, TileId } from './types';

const OFFSET_FROM_POINT = 40; // world units to the right of the point
const DEFAULT_IMPORTANCE_RANGE: [number, number] = [1, 5];

export type PointMenuProps = {
  point: PathPoint;
  /** The path the point belongs to. Its color is shown on the color tile. */
  path: Path;
  onUpdate: (patch: PointPatch) => void;
  /** Called to add a point after this one. Return an error message to show, or null when it worked. */
  onAddNext: (input: NextPointInput) => string | null;
  onPathColor: (color: string) => void;
  onDelete: () => void;
  /** False while earlier points are not done yet. Default true. */
  canComplete?: boolean;
  importanceRange?: [number, number];
  /** Colors offered for paths. Default: `PATH_PALETTE`. */
  colors?: readonly string[];
  /** Tiles to leave out. */
  hide?: readonly TileId[];
};

/**
 * Tile menu next to a selected point. It sits on the map's overlay, so it moves with the camera
 * and keeps its size when zooming. Place it inside `<PathWorld>` while a point is selected.
 */
export function PointMenu(props: PointMenuProps) {
  const handle = usePathWorldHandle();
  useWorldVersion(handle);
  const [open, setOpen] = useState<TileId | null>(null);
  const position = handle.positionOf(props.point.id);
  if (!position) return null;

  const { point, path } = props;
  const colors = props.colors ?? PATH_PALETTE;
  const tiles = TILES.filter((tile) => !props.hide?.includes(tile.id));
  const close = () => setOpen(null);

  const panels: Record<TileId, React.ReactNode> = {
    status: <StatusPanel status={point.status} canComplete={props.canComplete ?? true} onUpdate={props.onUpdate} />,
    next: <NextPointPanel colors={colors} onAddNext={props.onAddNext} onDone={close} />,
    kind: <KindPanel kind={point.kind} branches={point.next.length >= 2} onUpdate={props.onUpdate} />,
    color: <ColorPanel colors={colors} value={path.color} onPick={props.onPathColor} />,
    rename: <RenamePanel title={point.title} onRename={(title) => props.onUpdate({ title })} onDone={close} />,
    details: (
      <DetailsPanel
        point={point}
        importanceRange={props.importanceRange ?? DEFAULT_IMPORTANCE_RANGE}
        onUpdate={props.onUpdate}
      />
    ),
    remove: <DeletePanel onDelete={props.onDelete} />,
  };

  return createPortal(
    <div className="pw-point-menu" data-pw-ui style={{ left: position.x + OFFSET_FROM_POINT, top: position.y }}>
      <div className="pw-menu-grid">
        <div className="pw-menu-title">
          <strong>{point.title}</strong>
          <span>{STATUS_LABELS[point.status]}</span>
        </div>
        <div className="pw-menu-tiles">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`pw-tile${open === tile.id ? ' is-open' : ''}${tile.id === 'remove' ? ' is-danger' : ''}`}
              onClick={() => setOpen((current) => (current === tile.id ? null : tile.id))}
            >
              <span className="pw-glyph" style={tile.id === 'color' ? { color: path.color } : undefined}>
                {tile.glyph}
              </span>
              <span className="pw-tile-label">{tile.label}</span>
            </button>
          ))}
        </div>
      </div>
      {open && <div className="pw-menu-sub">{panels[open]}</div>}
    </div>,
    handle.overlay,
  );
}
