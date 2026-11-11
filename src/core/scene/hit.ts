import type { Position } from '../types.js';
import { LEAD_FONT_SIZE } from './leads.js';
import type { EdgeDraw, LeadDraw, NodeDraw } from './types.js';

/** The node under a world position. Later drawn nodes lie on top and are hit first. */
export function hitNode(nodes: NodeDraw[], at: Position): NodeDraw | null {
  return nodes.findLast((node) => Math.hypot(at.x - node.x, at.y - node.y) <= node.size / 2) ?? null;
}

/** How close a position has to be to hit something, in world units. */
export type Reach = {
  /** Around a line and the label of a line, so a thin line is easy to hit. */
  line: number;
  /** Around the arrow at the end of a line, where it can be taken to move the line. */
  end: number;
};

/** The reach in a view that is not zoomed out: what the pointer needs at normal size. */
export const DEFAULT_REACH: Reach = { line: 12, end: 22 };

const LINE_REACH_PIXELS = 6; // on the screen, so that lines are as easy to hit when the view is zoomed out
const END_REACH_PIXELS = 14;
const CHARACTER_WIDTH = 0.6; // of the font size, an estimate for the width of a label

/** The reach for a zoom level: never less than at normal size, but a fixed number of screen pixels when zoomed out. */
export function reachAt(zoom: number): Reach {
  return {
    line: Math.max(DEFAULT_REACH.line, LINE_REACH_PIXELS / zoom),
    end: Math.max(DEFAULT_REACH.end, END_REACH_PIXELS / zoom),
  };
}

function distanceToSegment(at: Position, from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((at.x - from.x) * dx + (at.y - from.y) * dy) / length));
  return Math.hypot(at.x - (from.x + t * dx), at.y - (from.y + t * dy));
}

function onLabel(lead: LeadDraw, at: Position, padding: number): boolean {
  const width = lead.text.length * LEAD_FONT_SIZE * CHARACTER_WIDTH;
  const height = LEAD_FONT_SIZE * 1.4;
  const left = lead.x - lead.anchor.x * width;
  const top = lead.y - lead.anchor.y * height;
  return (
    at.x >= left - padding && at.x <= left + width + padding && at.y >= top - padding && at.y <= top + height + padding
  );
}

function onLine(line: readonly Position[], at: Position, padding: number): boolean {
  return line.slice(1).some((point, index) => distanceToSegment(at, line[index], point) <= padding);
}

/** The line that leaves the view under a world position: on its label or on the line itself. */
export function hitLead(leads: LeadDraw[], at: Position, reach: Reach = DEFAULT_REACH): LeadDraw | null {
  return leads.find((lead) => onLabel(lead, at, reach.line) || onLine(lead.line, at, reach.line)) ?? null;
}

/** The line whose end (the arrow at the edge of the view) is under a world position, to be dragged by it. */
export function hitLeadEnd(leads: LeadDraw[], at: Position, reach: Reach = DEFAULT_REACH): LeadDraw | null {
  return leads.find((lead) => Math.hypot(at.x - lead.end.x, at.y - lead.end.y) <= reach.end) ?? null;
}

/**
 * The connection between two points of the view under a world position. `known` holds the ids of those points, which
 * leaves out the lines that leave the view or span it: they have stand-ins at their ends, not points.
 */
export function hitConnection(
  edges: EdgeDraw[],
  known: ReadonlySet<string>,
  at: Position,
  reach: Reach = DEFAULT_REACH,
): EdgeDraw | null {
  return (
    edges.find((edge) => known.has(edge.from) && known.has(edge.to) && onLine(edge.points, at, reach.line)) ?? null
  );
}
