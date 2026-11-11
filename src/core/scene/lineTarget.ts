import type { Lead, PlacedPoint, Position } from '../types.js';
import { DEFAULT_REACH, hitConnection, hitLead, type Reach } from './hit.js';
import type { LeadDraw, Scene } from './types.js';

/** One end of a line: a point, or the point out there that a line leaves the view for. */
export type LineEnd = { id?: string; title: string; date: string };

/** The two ends of a line that was hit, the earlier one first. */
export type LineTarget = { from: LineEnd; to: LineEnd };

const endOfPoint = (point: PlacedPoint): LineEnd => ({ id: point.id, title: point.title, date: point.date });
const endOfLead = (lead: Lead): LineEnd => ({ id: lead.id, title: lead.title, date: lead.date });

/** The two ends of the line that a lead belongs to. Null when the point it leaves from is not in the view. */
export function targetOfLead(lead: LeadDraw, byId: ReadonlyMap<string, PlacedPoint>): LineTarget | null {
  if (lead.span) return { from: endOfLead(lead.span.from), to: endOfLead(lead.span.to) };
  const point = byId.get(lead.pointId);
  if (!point) return null;
  return lead.side === 'before'
    ? { from: endOfLead(lead.lead), to: endOfPoint(point) }
    : { from: endOfPoint(point), to: endOfLead(lead.lead) };
}

/**
 * The line under a world position, with both of its ends: a line that leaves the view, one that spans it,
 * or a connection between two points. Null when the position is on none of them. `points` are the points of the view.
 */
export function lineTargetAt(
  scene: Scene,
  points: readonly PlacedPoint[],
  at: Position,
  reach: Reach = DEFAULT_REACH,
): LineTarget | null {
  const byId = new Map(points.map((point) => [point.id, point]));
  const lead = hitLead(scene.leads, at, reach);
  if (lead) return targetOfLead(lead, byId);
  const edge = hitConnection(scene.edges, new Set(byId.keys()), at, reach);
  const from = edge && byId.get(edge.from);
  const to = edge && byId.get(edge.to);
  return from && to ? { from: endOfPoint(from), to: endOfPoint(to) } : null;
}
