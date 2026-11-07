import { Container, Graphics, type Text } from 'pixi.js';
import type { HereDraw } from '../../core/scene/types';
import type { TextPool } from './createTextPool';

const INK = '#edefe6';

type HereSlot = { container: Container; ring: Graphics; label: Text };

export type HereLayer = {
  container: Container;
  /** Off: the ring does not pulse. */
  setAnimate(animate: boolean): void;
  isAnimated(): boolean;
  sync(heres: HereDraw[]): void;
  /** Pulses the rings. `phase` runs from 0 to 1 and repeats. */
  tick(phase: number): void;
};

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
  return { container, ring, label };
}

/** Draws the "today" markers: a white dot with a pulsing ring and a label. */
export function createHereLayer(texts: TextPool): HereLayer {
  const container = new Container();
  const slots = new Map<string, HereSlot>();
  let animate = true;

  const slotFor = (id: string): HereSlot => {
    const existing = slots.get(id);
    if (existing) return existing;
    const created = createHereSlot(texts);
    container.addChild(created.container);
    slots.set(id, created);
    return created;
  };

  return {
    container,
    setAnimate: (on) => {
      animate = on;
    },
    isAnimated: () => animate && slots.size > 0,

    sync(heres) {
      const seen = new Set<string>();
      heres.forEach((here) => {
        seen.add(here.id);
        slotFor(here.id).container.position.set(here.x, here.y);
      });
      slots.forEach((slot, id) => {
        if (seen.has(id)) return;
        texts.drop(slot.label);
        slot.container.destroy({ children: true });
        slots.delete(id);
      });
    },

    tick(phase) {
      slots.forEach((slot) => {
        slot.ring.scale.set(1 + 1.2 * phase);
        slot.ring.alpha = 0.6 * (1 - phase);
      });
    },
  };
}
