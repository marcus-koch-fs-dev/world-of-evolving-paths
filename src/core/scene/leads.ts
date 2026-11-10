import { toDay } from '../dates.js';
import { formatPointDate } from '../format.js';
import type { Lead, PlacedPoint, PlacedWorld, Position } from '../types.js';
import { buildEdges } from './edges.js';
import type { EdgeDraw, LeadDraw, SceneState } from './types.js';

/** Size of the text of a label. The layer draws with it, the hit test estimates the width from it. */
export const LEAD_FONT_SIZE = 15;
const LEAD_LENGTH = 220; // how far a line runs out of the view, along the time axis
const LEAD_SPREAD = 44; // room between lines that leave on the same side of one point
/** Size of the arrow at the end of a line. The label keeps its distance from it. */
export const LEAD_ARROW_SIZE = 12;
const LABEL_GAP = LEAD_ARROW_SIZE + 4; // between the end of the line and its text

type Side = LeadDraw['side'];
type Found = { edges: EdgeDraw[]; labels: LeadDraw[] };

const NOTHING: Found = { edges: [], labels: [] };

/** Which spot of the text sits on the end of the line, so the text grows away from the point along the time axis. */
export function leadAnchor(side: Side, direction: Position): Position {
  const sign = side === 'before' ? 1 : -1;
  return { x: 0.5 + sign * 0.5 * direction.x, y: 0.5 + sign * 0.5 * direction.y };
}

/** A stand-in for the point out there, at the end of its line. It lets the line look like any other connection. */
function standIn(world: PlacedWorld, point: PlacedPoint, lead: Lead, side: Side, index: number, count: number) {
  const direction = side === 'before' ? -1 : 1;
  const stand: PlacedPoint = {
    id: `lead:${side}:${point.id}:${index}`,
    pathId: point.pathId,
    title: lead.title,
    date: lead.date,
    kind: 'milestone',
    status: toDay(lead.date) <= toDay(world.today) ? 'done' : 'open',
    // A line that goes on keeps the strength of the path, so it does not shrink at the edge of the view
    strength: side === 'after' ? point.strength : undefined,
    next: side === 'before' ? [point.id] : [],
    x: point.x + direction * LEAD_LENGTH,
    y: point.y + (index - (count - 1) / 2) * LEAD_SPREAD,
  };
  return stand;
}

function leadsOfSide(
  world: PlacedWorld,
  point: PlacedPoint,
  side: Side,
  leads: readonly Lead[],
  state: SceneState,
): Found {
  const dateOf = (iso: string) =>
    state.formatDate ? state.formatDate(iso) : formatPointDate(iso, world.today, state.locale);
  return leads.reduce<Found>((found, lead, index) => {
    const stand = standIn(world, point, lead, side, index, leads.length);
    const own = { ...point, next: side === 'before' ? [] : [stand.id] };
    // The line is drawn like a connection between two points, so it has the look of its path and strength
    const [edge] = buildEdges({ ...world, points: [stand, own] }, state);
    const gap = side === 'before' ? -LABEL_GAP : LABEL_GAP;
    const label: LeadDraw = {
      id: stand.id,
      pointId: point.id,
      lead,
      x: stand.x + gap,
      y: stand.y,
      text: `${lead.title} · ${dateOf(lead.date)}`,
      end: { x: stand.x, y: stand.y },
      outward: { x: side === 'before' ? -1 : 1, y: 0 },
      color: edge.color,
      hovered: state.hovered === stand.id,
      side,
      anchor: leadAnchor(side, { x: 1, y: 0 }),
    };
    return { edges: [...found.edges, edge], labels: [...found.labels, label] };
  }, NOTHING);
}

/**
 * The lines that leave the view and their labels. A point that continues outside the view gets a line towards
 * the edge in time, with the title and date of the point out there.
 */
export function buildLeads(world: PlacedWorld, state: SceneState): Found {
  return world.points
    .flatMap((point) => [
      leadsOfSide(world, point, 'before', point.incoming ?? [], state),
      leadsOfSide(world, point, 'after', point.outgoing ?? [], state),
    ])
    .reduce<Found>(
      (all, part) => ({ edges: [...all.edges, ...part.edges], labels: [...all.labels, ...part.labels] }),
      NOTHING,
    );
}
