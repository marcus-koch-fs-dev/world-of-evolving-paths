export const FLOW_MS = 1500; // the dash pattern advances by FLOW_STEP in this time
export const FLOW_STEP = 12;
export const DRAW_MS = 1200; // a lit line draws itself in
export const RING_MS = 1800;
export const BOB_MS = 1400;
export const GLOW_MS = 2400;

export const now = () => performance.now();

export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** The share of the remaining way to cover in one frame, for a time constant `tau`: the same glide at any frame rate. */
export const followShare = (deltaMs: number, tau: number) => 1 - Math.exp(-deltaMs / tau);

/** Is a value still more than `step` away from its target? */
export const isApproaching = (current: number, target: number, step: number) => Math.abs(target - current) > step;

/** A value moved toward its target by `share` of the way. Within `step` of the target it lands on it. */
export const approach = (current: number, target: number, share: number, step: number) =>
  isApproaching(current, target, step) ? current + (target - current) * share : target;

/** Offset of the moving dash pattern at a point in time. */
export function flowShift(time: number): number {
  return ((time % FLOW_MS) / FLOW_MS) * FLOW_STEP;
}
