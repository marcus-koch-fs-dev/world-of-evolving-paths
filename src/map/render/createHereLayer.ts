import { Container, Graphics, type Text } from 'pixi.js';
import type { HereDraw } from '../../core/scene/types.js';
import { createSlotMap } from './createSlotMap.js';
import type { TextPool } from './createTextPool.js';
import { HERE_ON_POINT_PULSE, HERE_PULSE, pulseRing } from './pulse.js';
import { followShare } from './timing.js';

const INK = '#edefe6';
const GLIDE_TAU_MS = 140; // time constant of the glide towards the target, in milliseconds
const GLIDE_STEP = 0.2; // world units: closer than this the marker snaps onto the target

type HereSlot = {
  container: Container;
  ring: Graphics;
  label: Text;
  target: { x: number; y: number };
  /** The radius the ring is drawn with, and whether the marker rests on a point. */
  radius: number;
  onPoint: boolean;
};

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
  const share = followShare(deltaMs, GLIDE_TAU_MS);
  slot.container.position.set(
    slot.container.x + (slot.target.x - slot.container.x) * share,
    slot.container.y + (slot.target.y - slot.container.y) * share,
  );
  return true;
}

function drawRing(ring: Graphics, radius: number): void {
  ring.clear().circle(0, 0, radius).stroke({ width: 2, color: '#ffffff' });
}

/** One marker: a white dot with a ring around it and the word "Today" above. */
function createHereSlot(here: HereDraw, texts: TextPool): HereSlot {
  const container = new Container();
  const dot = new Graphics();
  dot.circle(0, 0, 10).fill({ color: '#000000', alpha: 0.4 });
  dot.circle(0, 0, 7).fill({ color: '#ffffff' });
  const ring = new Graphics();
  drawRing(ring, here.radius);
  const label = texts.make('Today', 11, INK);
  label.anchor.set(0.5, 1);
  label.position.set(0, -13);
  container.addChild(ring, dot, label);
  container.position.set(here.x, here.y);
  return { container, ring, label, target: { x: here.x, y: here.y }, radius: here.radius, onPoint: here.onPoint };
}

/** Draws the "today" markers: a white dot with a pulsing ring and a label. */
export function createHereLayer(texts: TextPool): HereLayer {
  const container = new Container();
  let animate = true;

  const slots = createSlotMap<HereDraw, HereSlot>({
    create(here) {
      const slot = createHereSlot(here, texts);
      container.addChild(slot.container);
      return slot;
    },
    destroy(slot) {
      texts.drop(slot.label);
      slot.container.destroy({ children: true });
    },
  });

  const update = (slot: HereSlot, here: HereDraw) => {
    slot.target = { x: here.x, y: here.y };
    slot.onPoint = here.onPoint;
    if (here.radius !== slot.radius) {
      slot.radius = here.radius;
      drawRing(slot.ring, here.radius);
    }
    if (!animate) slot.container.position.set(here.x, here.y);
  };

  return {
    container,
    setAnimate: (on) => {
      animate = on;
    },
    isAnimated: () => animate && slots.values().length > 0,
    isMoving: () => animate && slots.values().some(isGliding),
    sync: (heres) => slots.sync(heres, update),

    tick(phase, deltaMs) {
      // Every marker glides, so collect the results first and only then ask whether any is still moving
      const moving = slots.values().map((slot) => {
        pulseRing(slot.ring, phase, slot.onPoint ? HERE_ON_POINT_PULSE : HERE_PULSE);
        return animate ? glide(slot, deltaMs) : false;
      });
      return moving.some(Boolean);
    },
  };
}
