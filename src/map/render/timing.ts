export const FLOW_MS = 1500; // the dash pattern advances by FLOW_STEP in this time
export const FLOW_STEP = 12;
export const DRAW_MS = 1200; // a lit line draws itself in
export const RING_MS = 1800;
export const BOB_MS = 1400;
export const GLOW_MS = 2400;

export const now = () => performance.now();

export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Offset of the moving dash pattern at a point in time. */
export function flowShift(time: number): number {
  return ((time % FLOW_MS) / FLOW_MS) * FLOW_STEP;
}
