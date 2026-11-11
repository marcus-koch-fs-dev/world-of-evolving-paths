import { fromDay, toDay } from '../dates.js';
import { laneOffsets } from '../layout.js';
import { tileWidth, xOfDate } from '../timeAxis.js';
import type { PathInfo, PathThrough, PlacedPoint, PlacedWorld, Position } from '../types.js';
import { buildEdges } from './edges.js';
import { type Found, LABEL_GAP, leadAnchor, leadText, NOTHING } from './leads.js';
import { throughKey } from './lineGeometry.js';
import type { Tracks } from './tracks.js';
import type { LeadDraw, SceneState } from './types.js';
import { viewEdges } from './viewEdges.js';

/** A connection that spans the view without a point in it, as a line across the view near the lane of its path. */
export type ThroughLine = {
  path: PathInfo;
  through: PathThrough;
  /** Which of the lines of this path it is. */
  index: number;
  from: Position;
  to: Position;
};

/**
 * The lines of the connections that span the view: from the first day of the period to its last, near the lane of
 * their path. A path with several (a fork) gets one line each, side by side, and every line keeps its distance from
 * the others (see `lineTracks`). A free view has none.
 */
export function throughLines(world: PlacedWorld, tracks: Tracks): ThroughLine[] {
  const edges = viewEdges(world);
  if (!edges) return [];
  return world.paths.flatMap((path) =>
    (path.through ?? []).map((through, index) => {
      const y = tracks.get(throughKey(path.id, index)) ?? 0;
      return { path, through, index, from: { x: edges.left, y }, to: { x: edges.right, y } };
    }),
  );
}

/** Where today is on a line that spans the view, or null when the connection is not under way today. */
export function todayOnThrough(world: PlacedWorld, line: ThroughLine): Position | null {
  const { period } = world;
  const today = toDay(world.today);
  const { from, to } = line.through;
  if (!period || today < toDay(from.date) || today >= toDay(to.date)) return null;
  return { x: xOfDate(world.today, period, tileWidth(world.points)), y: line.from.y };
}

/** A stand-in for the point before or after the view, at an end of the line. It makes the line look like any other. */
function standIn(world: PlacedWorld, line: ThroughLine, side: LeadDraw['side'], position: Position): PlacedPoint {
  const lead = side === 'before' ? line.through.from : line.through.to;
  return {
    id: `through:${side}:${line.path.id}:${line.index}`,
    pathId: line.path.id,
    title: lead.title,
    date: lead.date,
    kind: 'milestone',
    // As for a connection between two points: it counts as walked once the point at its end is reached, and until
    // then it is lit only up to today
    status: toDay(lead.date) <= toDay(world.today) ? 'done' : 'open',
    strength: side === 'after' ? line.through.strength : undefined,
    next: [],
    ...position,
  };
}

/** The line across the view and the two labels at its ends, with the title and date of the points out there. */
export function buildThrough(world: PlacedWorld, state: SceneState, tracks: Tracks): Found {
  const { period } = world;
  if (!period) return NOTHING;
  const lanes = laneOffsets(world.paths);
  return throughLines(world, tracks).reduce<Found>((found, line) => {
    const before = { ...standIn(world, line, 'before', line.from), date: fromDay(period.start) };
    const after = { ...standIn(world, line, 'after', line.to), date: fromDay(period.end) };
    // The dates of the stand-ins are the ends of the period, so the lit part of the line reaches today on the axis
    const [edge] = buildEdges({ ...world, points: [{ ...before, next: [after.id] }, after] }, state);
    const half = Math.floor(edge.points.length / 2);
    const label = (side: LeadDraw['side'], end: Position, line_: Position[]): LeadDraw => {
      const standing = side === 'before' ? before : after;
      const lead = side === 'before' ? line.through.from : line.through.to;
      return {
        id: standing.id,
        pointId: '',
        lead,
        x: end.x + (side === 'before' ? -LABEL_GAP : LABEL_GAP),
        y: end.y,
        text: leadText(world, state, lead),
        line: line_,
        end,
        outward: { x: side === 'before' ? -1 : 1, y: 0 },
        color: edge.color,
        hovered: state.hovered === standing.id,
        side,
        anchor: leadAnchor(side, { x: 1, y: 0 }),
        span: { from: line.through.from, to: line.through.to },
        trackKey: throughKey(line.path.id, line.index),
        lane: lanes.get(line.path.id) ?? 0,
      };
    };
    return {
      edges: [...found.edges, edge],
      labels: [
        ...found.labels,
        label('before', line.from, edge.points.slice(0, half + 1)),
        label('after', line.to, edge.points.slice(half)),
      ],
    };
  }, NOTHING);
}
