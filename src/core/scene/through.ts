import { fromDay, toDay } from '../dates.js';
import { laneOffsets } from '../layout.js';
import { tileWidth, xOfDate } from '../timeAxis.js';
import type { PathInfo, PathThrough, PlacedPoint, PlacedWorld, Position } from '../types.js';
import { cutAtX, sampleEdge, yAtX } from './curves.js';
import { buildEdges } from './edges.js';
import { type Found, LABEL_GAP, leadAnchor, leadText, NOTHING } from './leads.js';
import { leadEndX, throughEndKey, throughKey } from './lineGeometry.js';
import type { Tracks } from './tracks.js';
import type { LeadDraw, SceneState } from './types.js';
import { viewEdges } from './viewEdges.js';

/**
 * A connection that spans the view without a point in it, as a line across the view near the lane of its path. It
 * runs smoothly from the height where it comes in to the height where it leaves, like a connection between two points.
 */
export type ThroughLine = {
  path: PathInfo;
  through: PathThrough;
  /** Which of the lines of this path it is. */
  index: number;
  from: Position;
  to: Position;
};

/** Heights the user is dragging the ends of lines to right now, by the key of the line end. */
type EndOverrides = ReadonlyMap<string, number>;

/**
 * The lines of the connections that span the view: from the first day of the period to its last, near the lane of
 * their path. A path with several (a fork) gets one line each, side by side, and every line keeps its distance from
 * the others (see `lineTracks`). A line with `yStart` and `yEnd` runs from one height to the other. A free view has none.
 */
export function throughLines(world: PlacedWorld, tracks: Tracks, dragged: EndOverrides = new Map()): ThroughLine[] {
  const edges = viewEdges(world);
  if (!edges) return [];
  const lanes = laneOffsets(world.paths);
  // The other lines that leave the view end a little further out when their point is near the edge: this one ends
  // at the same x, so all arrows stand in a row
  const startX = Math.min(
    edges.left,
    ...world.points.filter((point) => point.incoming?.length).map((point) => leadEndX(world, point, 'before')),
  );
  const endX = Math.max(
    edges.right,
    ...world.points.filter((point) => point.outgoing?.length).map((point) => leadEndX(world, point, 'after')),
  );
  return world.paths.flatMap((path) =>
    (path.through ?? []).map((through, index) => {
      const middle = tracks.get(throughKey(path.id, index)) ?? 0;
      const endHeight = (side: LeadDraw['side'], kept: number | undefined) =>
        dragged.get(throughEndKey(path.id, index, side)) ??
        (kept === undefined ? middle : (lanes.get(path.id) ?? 0) + kept);
      return {
        path,
        through,
        index,
        from: { x: startX, y: endHeight('before', through.yStart) },
        to: { x: endX, y: endHeight('after', through.yEnd) },
      };
    }),
  );
}

/** Where today is on a line that spans the view, or null when the connection is not under way today. */
export function todayOnThrough(world: PlacedWorld, line: ThroughLine): Position | null {
  const { period } = world;
  const today = toDay(world.today);
  const { from, to } = line.through;
  if (!period || today < toDay(from.date) || today >= toDay(to.date)) return null;
  const x = xOfDate(world.today, period, tileWidth(world.points));
  const edges = viewEdges(world) ?? { left: line.from.x, right: line.to.x };
  const curve = sampleEdge({ x: edges.left, y: line.from.y }, { x: edges.right, y: line.to.y });
  return { x, y: yAtX(curve, x) };
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
  return throughLines(world, tracks, state.lineOverrides).reduce<Found>((found, line) => {
    // The curve runs exactly from border to border, at the heights the two periods share there. A short stretch
    // outside the borders puts the ends in a row with the arrows of the other lines
    const edges = viewEdges(world) ?? { left: line.from.x, right: line.to.x };
    const before = {
      ...standIn(world, line, 'before', { x: edges.left, y: line.from.y }),
      date: fromDay(period.start),
    };
    const after = { ...standIn(world, line, 'after', { x: edges.right, y: line.to.y }), date: fromDay(period.end) };
    const [built] = buildEdges({ ...world, points: [{ ...before, next: [after.id] }, after] }, state);
    const points = [line.from, ...built.points, line.to];
    // The lit part ends where the marker for today stands, at its place on the time axis
    const todayX = xOfDate(world.today, period, tileWidth(world.points));
    const edge = {
      ...built,
      points,
      lit: built.lit ? { ...built.lit, points: cutAtX(points, todayX) } : null,
    };
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
        // Each end can be dragged on its own, and the two heights are kept apart
        trackKey: throughEndKey(line.path.id, line.index, side),
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
