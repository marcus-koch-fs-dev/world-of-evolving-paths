import type { Position } from '../types.js';
import { LEAD_FONT_SIZE } from './leads.js';
import type { LeadDraw, NodeDraw } from './types.js';

/** The node under a world position. Later drawn nodes lie on top and are hit first. */
export function hitNode(nodes: NodeDraw[], at: Position): NodeDraw | null {
  return nodes.findLast((node) => Math.hypot(at.x - node.x, at.y - node.y) <= node.size / 2) ?? null;
}

const LEAD_HIT_PADDING = 12; // around the label and the line, so a thin line is easy to hit
const CHARACTER_WIDTH = 0.6; // of the font size, an estimate for the width of a label

function distanceToSegment(at: Position, from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((at.x - from.x) * dx + (at.y - from.y) * dy) / length));
  return Math.hypot(at.x - (from.x + t * dx), at.y - (from.y + t * dy));
}

function onLabel(lead: LeadDraw, at: Position): boolean {
  const width = lead.text.length * LEAD_FONT_SIZE * CHARACTER_WIDTH;
  const height = LEAD_FONT_SIZE * 1.4;
  const left = lead.x - lead.anchor.x * width;
  const top = lead.y - lead.anchor.y * height;
  return (
    at.x >= left - LEAD_HIT_PADDING &&
    at.x <= left + width + LEAD_HIT_PADDING &&
    at.y >= top - LEAD_HIT_PADDING &&
    at.y <= top + height + LEAD_HIT_PADDING
  );
}

function onLine(lead: LeadDraw, at: Position): boolean {
  return lead.line.slice(1).some((point, index) => distanceToSegment(at, lead.line[index], point) <= LEAD_HIT_PADDING);
}

/** The line that leaves the view under a world position: on its label or on the line itself. */
export function hitLead(leads: LeadDraw[], at: Position): LeadDraw | null {
  return leads.find((lead) => onLabel(lead, at) || onLine(lead, at)) ?? null;
}
