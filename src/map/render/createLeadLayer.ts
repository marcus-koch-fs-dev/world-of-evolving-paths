import { Container, type Text } from 'pixi.js';
import { LEAD_FONT_SIZE } from '../../core/scene/leads.js';
import type { LeadDraw } from '../../core/scene/types.js';
import { createSlotMap } from './createSlotMap.js';
import type { TextPool } from './createTextPool.js';

const FILL = '#b9bdb0';
const ALPHA = 0.8;

type LeadSlot = { text: Text; content: string };

export type LeadLayer = {
  container: Container;
  sync(leads: LeadDraw[]): void;
};

/** Draws the labels at the ends of the lines that leave the view: the title and date of the point out there. */
export function createLeadLayer(texts: TextPool): LeadLayer {
  const container = new Container();

  const slots = createSlotMap<LeadDraw, LeadSlot>({
    create(lead) {
      const text = texts.make(lead.text, LEAD_FONT_SIZE, FILL);
      text.alpha = ALPHA;
      container.addChild(text);
      return { text, content: lead.text };
    },
    destroy: (slot) => texts.drop(slot.text),
  });

  return {
    container,
    sync(leads) {
      slots.sync(leads, (slot, lead) => {
        if (slot.content !== lead.text) {
          slot.text.text = lead.text;
          slot.content = lead.text;
        }
        slot.text.anchor.set(lead.anchor.x, lead.anchor.y);
        slot.text.position.set(lead.x, lead.y);
      });
    },
  };
}
