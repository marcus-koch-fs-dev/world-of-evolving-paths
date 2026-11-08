const RING_GROWTH = 1.2; // a pulse grows to this much bigger than the ring
const RING_ALPHA = 0.6;

type Pulsing = { scale: { set(value: number): void }; alpha: number };

/** Sets a ring to a moment of its pulse: `phase` 0 is small and visible, 1 is big and gone. */
export function pulseRing(ring: Pulsing, phase: number): void {
  ring.scale.set(1 + RING_GROWTH * phase);
  ring.alpha = RING_ALPHA * (1 - phase);
}
