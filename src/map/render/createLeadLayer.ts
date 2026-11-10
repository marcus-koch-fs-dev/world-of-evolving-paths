import { Container, Graphics, type Text } from 'pixi.js';
import { LEAD_ARROW_SIZE, LEAD_FONT_SIZE } from '../../core/scene/leads.js';
import type { LeadDraw } from '../../core/scene/types.js';
import { createSlotMap } from './createSlotMap.js';
import type { TextPool } from './createTextPool.js';

const FILL = '#b9bdb0';
const ALPHA = 0.8;
const HOVER_SCALE = 1.4;
const ARROW_WIDTH = 0.6; // half the width of the arrow, as a part of its size

type LeadSlot = { text: Text; arrow: Graphics; content: string; color: string };

export type LeadLayer = {
  container: Container;
  sync(leads: LeadDraw[]): void;
};

/** An arrow that points along +x, centered on its middle. The slot turns and moves it. */
function paintArrow(arrow: Graphics, color: string) {
  const half = LEAD_ARROW_SIZE / 2;
  arrow
    .clear()
    .poly([half, 0, -half, LEAD_ARROW_SIZE * ARROW_WIDTH, -half, -LEAD_ARROW_SIZE * ARROW_WIDTH])
    .fill(color);
}

/**
 * Draws what marks the end of a line that leaves the view: an arrow that points out of the view, and the title and
 * date of the point out there. Both stand out while the pointer is on the line.
 */
export function createLeadLayer(texts: TextPool): LeadLayer {
  const container = new Container();

  const slots = createSlotMap<LeadDraw, LeadSlot>({
    create(lead) {
      const text = texts.make(lead.text, LEAD_FONT_SIZE, FILL);
      const arrow = new Graphics();
      container.addChild(arrow, text);
      return { text, arrow, content: lead.text, color: '' };
    },
    destroy(slot) {
      texts.drop(slot.text);
      slot.arrow.destroy();
    },
  });

  return {
    container,
    sync(leads) {
      slots.sync(leads, (slot, lead) => {
        if (slot.content !== lead.text) {
          slot.text.text = lead.text;
          slot.content = lead.text;
        }
        if (slot.color !== lead.color) {
          paintArrow(slot.arrow, lead.color);
          slot.color = lead.color;
        }
        slot.text.anchor.set(lead.anchor.x, lead.anchor.y);
        slot.text.position.set(lead.x, lead.y);
        slot.text.alpha = lead.hovered ? 1 : ALPHA;
        slot.arrow.position.set(lead.end.x, lead.end.y);
        slot.arrow.rotation = Math.atan2(lead.outward.y, lead.outward.x);
        slot.arrow.scale.set(lead.hovered ? HOVER_SCALE : 1);
      });
    },
  };
}
