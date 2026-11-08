const WHEEL_SENSITIVITY = 0.0015;

/** The zoom factor for a wheel turn: scrolling up zooms in, down zooms out, evenly in both directions. */
export function wheelFactor(deltaY: number): number {
  return Math.exp(-deltaY * WHEEL_SENSITIVITY);
}
