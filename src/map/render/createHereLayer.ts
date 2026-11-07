import { Container, Graphics, type Text } from 'pixi.js';
import type { HereDraw } from '../../core/scene/types';
import type { TextPool } from './createTextPool';

const INK = '#edefe6';
const GLIDE_TAU_MS = 140; // time constant of the glide towards the target, in milliseconds
const GLIDE_STEP = 0.2; // world units: closer than this the marker snaps onto the target

type HereSlot = { container: Container; ring: Graphics; label: Text; target: { x: number; y: number } };

export type HereLayer = {
  container: Container;
  /** Off: the ring does not pulse and the marker jumps instead of gliding. */
  setAnimate(animate: boolean): void;
  isAnimated(): boolean;
  isMoving(): boolean;
  sync(heres: HereDraw[]): void;
  /** Pulses the rings and glides the markers. `phase` runs from 0 to 1 and repeats. Returns true while a marker still moves. */
  tick(phase: number, deltaMs: number): boolean;
};

const isGliding = (slot: HereSlot) =>
  Math.hypot(slot.target.x - slot.container.x, slot.target.y - slot.container.y) > GLIDE_STEP;

/** Moves a marker a step towards its target. Returns true while it has not arrived. */
function glide(slot: HereSlot, deltaMs: number): boolean {
  if (!isGliding(slot)) {
    slot.container.position.set(slot.target.x, slot.target.y);
    return false;
  }
  const share = 1 - Math.exp(-deltaMs / GLIDE_TAU_MS);
  slot.container.position.set(
    slot.container.x + (slot.target.x - slot.container.x) * share,
    slot.container.y + (slot.target.y - slot.container.y) * share,
  );
  return true;
}

/** One marker: a white dot with a ring around it and the word "Today" above. */
function createHereSlot(texts: TextPool): HereSlot {
  const container = new Container();
  const dot = new Graphics();
  dot.circle(0, 0, 10).fill({ color: '#000000', alpha: 0.4 });
  dot.circle(0, 0, 7).fill({ color: '#ffffff' });
  const ring = new Graphics();
  ring.circle(0, 0, 11).stroke({ width: 2, color: '#ffffff' });
  const label = texts.make('Today', 11, INK);
  label.anchor.set(0.5, 1);
  label.position.set(0, -13);
  container.addChild(ring, dot, label);
  return { container, ring, label, target: { x: 0, y: 0 } };
}

/** Draws the "today" markers: a white dot with a pulsing ring and a label. */
export function createHereLayer(texts: TextPool): HereLayer {
  const container = new Container();
  const slots = new Map<string, HereSlot>();
  let animate = true;

  const slotFor = (here: HereDraw): HereSlot => {
    const existing = slots.get(here.id);
    if (existing) return existing;
    const created = createHereSlot(texts);
    created.target = { x: here.x, y: here.y };
    created.container.position.set(here.x, here.y);
    container.addChild(created.container);
    slots.set(here.id, created);
    return created;
  };

  return {
    container,
    setAnimate: (on) => {
      animate = on;
    },
    isAnimated: () => animate && slots.size > 0,
    isMoving: () => animate && [...slots.values()].some(isGliding),

    sync(heres) {
      const seen = new Set<string>();
      heres.forEach((here) => {
        seen.add(here.id);
        const slot = slotFor(here);
        slot.target = { x: here.x, y: here.y };
        if (!animate) slot.container.position.set(here.x, here.y);
      });
      slots.forEach((slot, id) => {
        if (seen.has(id)) return;
        texts.drop(slot.label);
        slot.container.destroy({ children: true });
        slots.delete(id);
      });
    },

    tick(phase, deltaMs) {
      // Every marker glides, so collect the results first and only then ask whether any is still moving
      const moving = [...slots.values()].map((slot) => {
        slot.ring.scale.set(1 + 1.2 * phase);
        slot.ring.alpha = 0.6 * (1 - phase);
        return animate ? glide(slot, deltaMs) : false;
      });
      return moving.some(Boolean);
    },
  };
}
