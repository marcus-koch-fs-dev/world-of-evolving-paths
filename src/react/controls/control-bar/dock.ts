// The places a bar can be docked: along the top or the bottom edge, at the left, middle or right
export type DockEdge = 'top' | 'bottom';
export type DockAlign = 'left' | 'center' | 'right';
export type DockSlot = `${DockEdge}-${DockAlign}`;

export const DOCK_EDGES: readonly DockEdge[] = ['top', 'bottom'];
export const DOCK_ALIGNS: readonly DockAlign[] = ['left', 'center', 'right'];

/** All six places: each edge has a left, a middle and a right zone. Bars in one zone sit together and do not push the others. */
export const DOCK_SLOTS: readonly DockSlot[] = DOCK_EDGES.flatMap((edge) =>
  DOCK_ALIGNS.map((align) => `${edge}-${align}` as const),
);

/** The edge a slot belongs to. */
export function edgeOf(slot: DockSlot): DockEdge {
  return slot.startsWith('top') ? 'top' : 'bottom';
}

/** Where along its edge a slot sits. */
export function alignOf(slot: DockSlot): DockAlign {
  if (slot.endsWith('left')) return 'left';
  return slot.endsWith('right') ? 'right' : 'center';
}

/** The slot nearest to a point in an area: top or bottom half, left, middle or right third. */
export function slotAt(x: number, y: number, width: number, height: number): DockSlot {
  const edge: DockEdge = y < height / 2 ? 'top' : 'bottom';
  const align: DockAlign = x < width / 3 ? 'left' : x > (width * 2) / 3 ? 'right' : 'center';
  return `${edge}-${align}`;
}
