import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PATH_PALETTE, type PathInfo, type PathPoint } from '../../../core';
import { useWorldVersion } from '../../hooks/useWorldVersion';
import { usePathWorldHandle } from '../../PathWorldContext';
import { MenuTiles } from './MenuTiles';
import { ColorPanel } from './panels/ColorPanel';
import { DeletePanel } from './panels/DeletePanel';
import { DetailsPanel } from './panels/DetailsPanel';
import { KindPanel } from './panels/KindPanel';
import { NextPointPanel } from './panels/NextPointPanel';
import { RenamePanel } from './panels/RenamePanel';
import { STATUS_LABELS, StatusPanel } from './panels/StatusPanel';
import { anchorFor, type MenuPlacement, resolvePlacement } from './placement';
import './pointMenu.css';
import { TILES } from './tiles';
import type { NextPointInput, PointPatch, TileId } from './types';

const DEFAULT_IMPORTANCE_RANGE: [number, number] = [1, 5];

export type PointMenuProps = {
  point: PathPoint;
  /** The path the point belongs to. Its color is shown on the color tile. */
  path: PathInfo;
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
  /** Colors the user chose before, newest first. Shown as slots next to the palette. */
  customColors?: readonly string[];
  /** A custom color was confirmed. Remember it in your app and pass it back in `customColors`. */
  onCustomColor?: (color: string) => void;
  /** Tiles to leave out. */
  hide?: readonly TileId[];
  /** Where the menu sits next to the point. Default uto: below, or above when there is no room below. */
  placement?: MenuPlacement;
};

/**
 * Tile menu next to a selected point. It sits on the map's overlay, so it moves with the camera
 * and keeps its size when zooming. Place it inside `<PathWorld>` while a point is selected.
 */
export function PointMenu(props: PointMenuProps) {
  // A new point gets a fresh menu, so an open panel or a half-typed name never carries over to another point
  return <PointMenuBody key={props.point.id} {...props} />;
}

function PointMenuBody(props: PointMenuProps) {
  const handle = usePathWorldHandle();
  useWorldVersion(handle);
  const [open, setOpen] = useState<TileId | null>(null);
  const position = handle.positionOf(props.point.id);
  if (!position) return null;

  const { point, path } = props;
  const colors = props.colors ?? PATH_PALETTE;
  const tiles = TILES.filter((tile) => !props.hide?.includes(tile.id));
  const close = () => setOpen(null);
  const camera = handle.getCamera();
  const room = handle.overlay.parentElement?.clientHeight ?? Number.POSITIVE_INFINITY;
  const placement = resolvePlacement(props.placement ?? 'auto', position.y * camera.zoom + camera.y, room);

  const panels: Record<TileId, React.ReactNode> = {
    status: <StatusPanel status={point.status} canComplete={props.canComplete ?? true} onUpdate={props.onUpdate} />,
    next: <NextPointPanel colors={colors} defaultDate={point.date} onAddNext={props.onAddNext} onDone={close} />,
    kind: <KindPanel kind={point.kind} branches={point.next.length >= 2} onUpdate={props.onUpdate} />,
    color: (
      <ColorPanel
        colors={colors}
        value={path.color}
        onPick={props.onPathColor}
        customColors={props.customColors}
        onCustomColor={props.onCustomColor}
      />
    ),
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
    <div className={`pw-point-menu pw-menu-${placement}`} data-pw-ui style={anchorFor(placement, position)}>
      <div className="pw-menu-grid">
        <div className="pw-menu-title">
          <strong>{point.title}</strong>
          <span>{STATUS_LABELS[point.status]}</span>
        </div>
        <MenuTiles
          tiles={tiles}
          open={open}
          pathColor={path.color}
          onToggle={(id) => setOpen((current) => (current === id ? null : id))}
        />
      </div>
      {open && <div className="pw-menu-sub">{panels[open]}</div>}
    </div>,
    handle.overlay,
  );
}
