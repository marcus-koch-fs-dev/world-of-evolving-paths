import { toDay } from '../dates.js';
import { formatPointDate } from '../format.js';
import { laneOffsets } from '../lanes.js';
import type { Lead, PlacedArrow, PlacedPoint, PlacedSpan, PlacedWorld, Position } from '../types.js';
import { cutAtX, sampleEdge } from './curves.js';
import { buildEdges } from './edges.js';
import type { EdgeDraw, LeadDraw, SceneState } from './types.js';
import { dateAtAxisX, todayAxisX } from './viewEdges.js';

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

const arrowId = (key: string) => `arrow:${key}`;

/** The height of an arrow: the one the user is dragging it to right now, else the one it has. */
const heightOf = (state: Pick<SceneState, 'lineOverrides'>, key: string, y: number) =>
  state.lineOverrides?.get(key) ?? y;

/** A stand-in for the point out there, at the end of a line. It lets the line look like any other connection. */
function standIn(world: PlacedWorld, base: PlacedPoint | undefined, arrow: PlacedArrow, at: Position): PlacedPoint {
  return {
    id: arrowId(arrow.key),
    pathId: arrow.pathId,
    branchId: base?.branchId ?? '',
    title: arrow.far.title,
    // The line is drawn up to the border of the view, so its end stands for the date at that place on the time axis.
    // Then the part that is lit (walked) ends where today lies on the axis, like the marker for today.
    date: dateAtAxisX(world, at.x) ?? arrow.far.date,
    kind: 'milestone',
    status: toDay(arrow.far.date) <= toDay(world.today) ? 'done' : 'open',
    importance: 1,
    // A line that goes on keeps the strength of the path, so it does not shrink at the edge of the view
    strength: arrow.side === 'after' ? base?.strength : undefined,
    next: arrow.side === 'before' && base ? [base.id] : [],
    ...at,
  };
}

/** The arrows next to points of the view, with their lines and labels. */
function attachedArrows(world: PlacedWorld, state: SceneState): Found {
  const byId = new Map(world.points.map((point) => [point.id, point]));
  const lanes = laneOffsets(world.paths);
  const todayX = todayAxisX(world);
  return world.arrows.reduce<Found>((found, arrow) => {
    const point = byId.get(arrow.pointId);
    if (!point) return found;
    const end = { x: arrow.x, y: heightOf(state, arrow.key, arrow.y) };
    const stand = standIn(world, point, arrow, end);
    const own = { ...point, next: arrow.side === 'before' ? [] : [stand.id] };
    // The line is drawn like a connection between two points, so it has the look of its path and strength
    const [built] = buildEdges({ ...world, points: [stand, own] }, state);
    // The lit part ends where the marker for today stands, at its place on the time axis, like on a line across the view
    const lit = built.lit && todayX !== null ? { ...built.lit, points: cutAtX(built.points, todayX) } : built.lit;
    const edge: EdgeDraw = { ...built, lit };
    const label: LeadDraw = {
      id: stand.id,
      pointId: point.id,
      lead: arrow.far,
      x: end.x + (arrow.side === 'before' ? -LABEL_GAP : LABEL_GAP),
      y: end.y,
      text: leadText(world, state, arrow.far),
      line: edge.points,
      end,
      outward: { x: arrow.side === 'before' ? -1 : 1, y: 0 },
      color: edge.color,
      hovered: state.hovered === stand.id,
      side: arrow.side,
      anchor: leadAnchor(arrow.side, { x: 1, y: 0 }),
      trackKey: arrow.key,
      lane: lanes.get(arrow.pathId) ?? 0,
      pathId: arrow.pathId,
    };
    return { edges: [...found.edges, edge], labels: [...found.labels, label] };
  }, NOTHING);
}

const ends = (span: PlacedSpan, state: Pick<SceneState, 'lineOverrides'>): [Position, Position] => [
  { x: span.before.x, y: heightOf(state, span.before.key, span.before.y) },
  { x: span.after.x, y: heightOf(state, span.after.key, span.after.y) },
];

/** The line a span draws, from one border to the other, as a curve between its two ends. */
export function spanCurve(span: PlacedSpan, state: Pick<SceneState, 'lineOverrides'>): Position[] {
  const [from, to] = ends(span, state);
  return sampleEdge(from, to);
}

/** The lines across the whole view, each with the two labels at its ends. */
function spanArrows(world: PlacedWorld, state: SceneState): Found {
  const { period } = world;
  if (!period) return NOTHING;
  const lanes = laneOffsets(world.paths);
  const todayX = todayAxisX(world);
  return world.spans.reduce<Found>((found, span) => {
    const [from, to] = ends(span, state);
    const stand = (side: Side, lead: Lead, at: Position): PlacedPoint => {
      const arrow: PlacedArrow = {
        ...at,
        key: side === 'before' ? span.before.key : span.after.key,
        pathId: span.pathId,
        side,
        pointId: '',
        far: lead,
      };
      const standing = standIn(world, undefined, arrow, at);
      return side === 'before' ? { ...standing, next: [] } : standing;
    };
    const before = stand('before', span.from, from);
    const after = { ...stand('after', span.to, to), strength: span.strength };
    const [built] = buildEdges({ ...world, points: [{ ...before, next: [after.id] }, after] }, state);
    const lit = built.lit && todayX !== null ? { ...built.lit, points: cutAtX(built.points, todayX) } : built.lit;
    const edge: EdgeDraw = { ...built, lit };
    const half = Math.floor(edge.points.length / 2);
    const label = (side: Side, end: Position, line: Position[]): LeadDraw => {
      const lead = side === 'before' ? span.from : span.to;
      const standing = side === 'before' ? before : after;
      return {
        id: standing.id,
        pointId: '',
        lead,
        x: end.x + (side === 'before' ? -LABEL_GAP : LABEL_GAP),
        y: end.y,
        text: leadText(world, state, lead),
        line,
        end,
        outward: { x: side === 'before' ? -1 : 1, y: 0 },
        color: edge.color,
        hovered: state.hovered === standing.id,
        side,
        anchor: leadAnchor(side, { x: 1, y: 0 }),
        span: { from: span.from, to: span.to },
        trackKey: side === 'before' ? span.before.key : span.after.key,
        lane: lanes.get(span.pathId) ?? 0,
        pathId: span.pathId,
      };
    };
    return {
      edges: [...found.edges, edge],
      labels: [
        ...found.labels,
        label('before', from, edge.points.slice(0, half + 1)),
        label('after', to, edge.points.slice(half)),
      ],
    };
  }, NOTHING);
}

/** The arrows where lines cross the border of the view, with their lines and labels. */
export function buildArrows(world: PlacedWorld, state: SceneState): Found {
  const [attached, spans] = [attachedArrows(world, state), spanArrows(world, state)];
  return { edges: [...attached.edges, ...spans.edges], labels: [...attached.labels, ...spans.labels] };
}
