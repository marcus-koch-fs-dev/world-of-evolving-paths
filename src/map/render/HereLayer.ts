import { Container, Graphics } from 'pixi.js';
import type { HereDraw } from '../../core/scene/types';
import type { TextPool } from './TextPool';

const INK = '#edefe6';

type HereSlot = { container: Container; ring: Graphics };

/** Draws the "today" markers: a white dot with a pulsing ring and a label. */
export class HereLayer {
  readonly container = new Container();
  private readonly slots = new Map<string, HereSlot>();

  constructor(private readonly texts: TextPool) {}

  get animated(): boolean {
    return this.slots.size > 0;
  }

  sync(heres: HereDraw[]): void {
    const seen = new Set<string>();
    for (const here of heres) {
      seen.add(here.id);
      const slot = this.slots.get(here.id) ?? this.create(here.id);
      slot.container.position.set(here.x, here.y);
    }
    for (const [id, slot] of this.slots) {
      if (seen.has(id)) continue;
      slot.container.destroy({ children: true });
      this.slots.delete(id);
    }
  }

  /** Pulses the rings. `phase` runs from 0 to 1 and repeats. */
  tick(phase: number): void {
    for (const slot of this.slots.values()) {
      slot.ring.scale.set(1 + 1.2 * phase);
      slot.ring.alpha = 0.6 * (1 - phase);
    }
  }

  private create(id: string): HereSlot {
    const container = new Container();
    const dot = new Graphics();
    dot.circle(0, 0, 10).fill({ color: '#000000', alpha: 0.4 });
    dot.circle(0, 0, 7).fill({ color: '#ffffff' });
    const ring = new Graphics();
    ring.circle(0, 0, 11).stroke({ width: 2, color: '#ffffff' });
    const label = this.texts.make('Today', 11, INK);
    label.anchor.set(0.5, 1);
    label.position.set(0, -13);
    container.addChild(ring, dot, label);
    this.container.addChild(container);
    const slot = { container, ring };
    this.slots.set(id, slot);
    return slot;
  }
}
