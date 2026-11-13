import type { Position } from '../../../core/index.js';

export type MenuPlacement = 'auto' | 'below' | 'above' | 'right' | 'left';
type ResolvedPlacement = Exclude<MenuPlacement, 'auto'>;

/** Where the panel of a tile (status, details ...) opens, around the grid of tiles. */
export type SubPlacement = 'right' | 'below' | 'left' | 'above';

const AROUND: readonly SubPlacement[] = ['above', 'right', 'below', 'left'];

/** The next place clockwise: above, right, below, left, and above again. Anything else starts at `right`. */
export function nextSubPlacement(current: SubPlacement): SubPlacement {
  const index = AROUND.indexOf(current);
  return index < 0 ? 'right' : AROUND[(index + 1) % AROUND.length];
}

const ROOM_NEEDED_BELOW = 380; // screen pixels the menu with its open panel needs under the point
const BELOW_OFFSET = 72; // world units under the point, past its name and date
const ABOVE_OFFSET = -44;
const SIDE_OFFSET = 44;

const ANCHORS: Record<ResolvedPlacement, (point: Position) => { left: number; top: number }> = {
  below: (point) => ({ left: point.x, top: point.y + BELOW_OFFSET }),
  above: (point) => ({ left: point.x, top: point.y + ABOVE_OFFSET }),
  right: (point) => ({ left: point.x + SIDE_OFFSET, top: point.y }),
  left: (point) => ({ left: point.x - SIDE_OFFSET, top: point.y }),
};

/** Where the menu goes. `auto` puts it below the point and moves it above when there is no room below. */
export function resolvePlacement(
  requested: MenuPlacement,
  pointScreenY: number,
  containerHeight: number,
): ResolvedPlacement {
  if (requested !== 'auto') return requested;
  return pointScreenY + ROOM_NEEDED_BELOW > containerHeight ? 'above' : 'below';
}

/** The world position of the menu's anchor for a placement, next to the point. */
export function anchorFor(placement: ResolvedPlacement, point: Position): { left: number; top: number } {
  return ANCHORS[placement](point);
}
