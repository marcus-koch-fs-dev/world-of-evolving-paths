type Pulsing = { scale: { set(value: number): void }; alpha: number };

/** How far a ring grows (as a share of its size) and how visible it starts. */
export type PulseStyle = { growth: number; alpha: number };

/** The ring on points that are being walked. It starts outside the shape, so it grows as far as the Today ring on a point. */
export const NODE_PULSE: PulseStyle = { growth: 0.6, alpha: 0.6 };
/** The ring of the "Today" marker in free space. */
export const HERE_PULSE: PulseStyle = { growth: 1.2, alpha: 0.6 };
/** The ring of a "Today" marker that rests on a point. It starts big, so it grows half as far. */
export const HERE_ON_POINT_PULSE: PulseStyle = { growth: 0.6, alpha: 0.6 };

/** Sets a ring to a moment of its pulse: `phase` 0 is small and visible, 1 is big and gone. */
export function pulseRing(ring: Pulsing, phase: number, { growth, alpha }: PulseStyle): void {
  ring.scale.set(1 + growth * phase);
  ring.alpha = alpha * (1 - phase);
}
