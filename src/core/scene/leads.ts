import { toDay } from '../dates.js';
import { formatPointDate } from '../format.js';
import type { Lead, PlacedPoint, PlacedWorld, Position } from '../types.js';
import { buildEdges } from './edges.js';
import { leadBaseY, leadEndX, leadKey } from './lineGeometry.js';
import type { Tracks } from './tracks.js';
import type { EdgeDraw, LeadDraw, SceneState } from './types.js';
import { dateAtAxisX } from './viewEdges.js';

/** Size of the text of a label. The layer draws with it, the hit test estimates the width from it. */
export const LEAD_FONT_SIZE = 15;
/** Size of the arrow at the end of a line. The label keeps its distance from it. */
export const LEAD_ARROW_SIZE = 12;
export const LABEL_GAP = LEAD_ARROW_SIZE + 4; // between the end of the line and its text

type Side = LeadDraw['side'];
export type Found = { edges: EdgeDraw[]; labels: LeadDraw[] };

export const NOTHING: Found = { edges: [], labels: [] };

/** The text of a label: the title of the point out there and its date. */
export function leadText(world: PlacedWorld, state: SceneState, lead: Lead): string {
  const date = state.formatDate ? state.formatDate(lead.date) : formatPointDate(lead.date, world.today, state.locale);
  return `${lead.title} · ${date}`;
}

/** Which spot of the text sits on the end of the line, so the text grows away from the point along the time axis. */
export function leadAnchor(side: Side, direction: Position): Position {
  const sign = side === 'before' ? 1 : -1;
  return { x: 0.5 + sign * 0.5 * direction.x, y: 0.5 + sign * 0.5 * direction.y };
}

/** A stand-in for the point out there, at the end of its line. It lets the line look like any other connection. */
function standIn(
  world: PlacedWorld,
  point: PlacedPoint,
  lead: Lead,
  side: Side,
  index: number,
  count: number,
  tracks: Tracks,
) {
  const x = leadEndX(world, point, side);
  const key = leadKey(side, point.id, index);
  const stand: PlacedPoint = {
    id: key,
    pathId: point.pathId,
    title: lead.title,
    // The line is drawn up to the edge of the view, so its end stands for the date at that place on the time axis.
    // Then the part that is lit (walked) ends where today lies on the axis, like the marker for today.
    date: dateAtAxisX(world, x) ?? lead.date,
    kind: 'milestone',
    status: toDay(lead.date) <= toDay(world.today) ? 'done' : 'open',
    // A line that goes on keeps the strength of the path, so it does not shrink at the edge of the view
    strength: side === 'after' ? point.strength : undefined,
    next: side === 'before' ? [point.id] : [],
    x,
    // Lines that run side by side keep their distance, see `lineTracks`
    y: tracks.get(key) ?? leadBaseY(point, undefined, index, count),
  };
  return stand;
}

function leadsOfSide(
  world: PlacedWorld,
  point: PlacedPoint,
  side: Side,
  leads: readonly Lead[],
  state: SceneState,
  tracks: Tracks,
): Found {
  return leads.reduce<Found>((found, lead, index) => {
    const stand = standIn(world, point, lead, side, index, leads.length, tracks);
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
      text: leadText(world, state, lead),
      line: edge.points,
      end: { x: stand.x, y: stand.y },
      outward: { x: side === 'before' ? -1 : 1, y: 0 },
      color: edge.color,
      hovered: state.hovered === stand.id,
      side,
      anchor: leadAnchor(side, { x: 1, y: 0 }),
      trackKey: stand.id,
    };
    return { edges: [...found.edges, edge], labels: [...found.labels, label] };
  }, NOTHING);
}

/**
 * The lines that leave the view and their labels. A point that continues outside the view gets a line towards
 * the edge in time, with the title and date of the point out there.
 */
export function buildLeads(world: PlacedWorld, state: SceneState, tracks: Tracks): Found {
  return world.points
    .flatMap((point) => [
      leadsOfSide(world, point, 'before', point.incoming ?? [], state, tracks),
      leadsOfSide(world, point, 'after', point.outgoing ?? [], state, tracks),
    ])
    .reduce<Found>(
      (all, part) => ({ edges: [...all.edges, ...part.edges], labels: [...all.labels, ...part.labels] }),
      NOTHING,
    );
}
