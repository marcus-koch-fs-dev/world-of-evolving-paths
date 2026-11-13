import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PATH_PALETTE, type PathInfo, type StorePoint } from '../../../core/index.js';
import { useWorldVersion } from '../../hooks/useWorldVersion.js';
import { usePathWorldHandle } from '../../PathWorldContext.js';
import { closingAfterActions } from './closingAfterActions.js';
import { MenuTiles } from './MenuTiles.js';
import { type PanelId, panelFor } from './panels/panelFor.js';
import { STATUS_LABELS } from './panels/StatusPanel.js';
import {
  anchorFor,
  type MenuPlacement,
  nextPlacement,
  resolvePlacement,
  type SubPlacement,
  subPlacementFor,
} from './placement.js';
import './pointMenu.css';
import { TILES, visibleTiles } from './tiles.js';
import type { NextPointInput, PointPatch, TileId } from './types.js';

export type PointMenuProps = {
  point: StorePoint;
  /** The path the point belongs to. Its color is shown on the color tile. */
  path: PathInfo;
  onUpdate: (patch: PointPatch) => void;
  /** Called to add a point after this one. Return an error message to show, or null when it worked. */
  onAddNext: (input: NextPointInput) => string | null;
  onPathColor: (color: string) => void;
  onDelete: () => void;
  /** True when a branch forks off from this point. The kind panel then explains the fork shape. Default false. */
  isFork?: boolean;
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
  /** Where the menu sits next to the point. Default auto: below, or above when there is no room below. */
  placement?: MenuPlacement;
  /**
   * Where the panel of a tile opens around the tiles. Default: it finds its place by itself, beside the tiles when the
   * menu is under the point, up when it is over the point, and under the tiles when the menu is beside the point.
   */
  subPlacement?: SubPlacement;
  /** The user turned the menu to another place, with the Turn tile. With it the menu has that tile. Keep the place in your app and pass it back in `placement`. It goes around the point: above, right, below, left. */
  onPlacementChange?: (placement: MenuPlacement) => void;
  /** The user pressed Check in. With it the menu has that key; without it the key is not there. */
  onCheckIn?: () => void;
  /** The path is already checked in today. The key then shows it and cannot be pressed. */
  checkedIn?: boolean;
  /** How many check-ins the path has. Shown under the name when given. */
  checkInCount?: number;
  /** The menu wants to close, after an action when `closeAfterAction` is on. Deselect the point to close it. */
  onClose?: () => void;
  /**
   * Close the menu after the user changed something (status, kind, date, importance, note), added a point or deleted
   * the point. Only has an effect with `onClose`. Default true. The path color stays open: people try several.
   */
  closeAfterAction?: boolean;
};

const checkInLabel = (count: number) => `${count} check-in${count === 1 ? '' : 's'}`;

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
  const [open, setOpen] = useState<PanelId | null>(null);
  const position = handle.positionOf(props.point.id);
  if (!position) return null;

  const { point, path } = props;
  // Turn and Check in are only there when the app wants to hear about them
  const tiles = visibleTiles(TILES, [
    ...(props.hide ?? []),
    ...(props.onPlacementChange ? [] : (['turn'] as const)),
    ...(props.onCheckIn ? [] : (['checkin'] as const)),
  ]);
  const close = () => setOpen(null);
  const camera = handle.getCamera();
  const room = handle.overlay.parentElement?.clientHeight ?? Number.POSITIVE_INFINITY;
  const placement = resolvePlacement(props.placement ?? 'auto', position.y * camera.zoom + camera.y, room);

  const sub = props.subPlacement ?? subPlacementFor(placement);
  const toggle = (id: TileId) => {
    if (id === 'turn') props.onPlacementChange?.(nextPlacement(placement));
    else if (id === 'checkin') props.onCheckIn?.();
    else setOpen((current) => (current === id ? null : id));
  };

  return createPortal(
    <div
      className={`pw-point-menu pw-menu-${placement} pw-sub-${sub}`}
      data-pw-ui
      style={anchorFor(placement, position)}
    >
      <div className="pw-menu-grid">
        <div className="pw-menu-title">
          <strong>{point.title}</strong>
          <span>
            {props.checkInCount === undefined
              ? STATUS_LABELS[point.status]
              : `${STATUS_LABELS[point.status]} · ${checkInLabel(props.checkInCount)}`}
          </span>
          <span>Path: {path.name}</span>
        </div>
        <MenuTiles
          tiles={tiles}
          open={open}
          pathColor={path.color}
          checkedIn={props.checkedIn ?? false}
          onToggle={toggle}
        />
      </div>
      {open && (
        <div className="pw-menu-sub">
          {panelFor(open, { menu: closingAfterActions(props), colors: props.colors ?? PATH_PALETTE, close })}
        </div>
      )}
    </div>,
    handle.overlay,
  );
}
