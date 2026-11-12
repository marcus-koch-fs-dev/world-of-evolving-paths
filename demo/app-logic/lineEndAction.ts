import type { LineEndMoveEvent, Path, Period } from 'world-of-evolving-paths';
import { heightLevelOf } from './heightLevel';
import type { BorderKeyOf } from './reach';
import { shiftedHeights } from './shiftPath';
import type { DemoAction } from './state';

type LineEndEvent = Pick<
  LineEndMoveEvent,
  'scope' | 'pathId' | 'side' | 'from' | 'to' | 'y' | 'shift' | 'offsets' | 'lineEnds'
>;

/**
 * Where the lines of a path cross the borders of a period, moved by `shift`: every line end of that path gets the
 * distance added to the height it had. A line that comes in crosses the border before the period, one that leaves
 * crosses the border after it. The neighbour period shares that border, so it shows the same height.
 */
function movedBoundaries(
  lineEnds: LineEndEvent['lineEnds'],
  pathPointIds: ReadonlySet<string>,
  period: Period,
  shift: number,
  keyOf: BorderKeyOf,
): Record<string, number> {
  return Object.fromEntries(
    lineEnds.flatMap(({ from, to, y, side }): [string, number][] => {
      if (!from.id || !to.id) return [];
      const moved = Math.round(y + shift);
      // A line across the whole view has no point in it: its end says which border it lies on
      if (side) return [[keyOf(from.id, to.id, side === 'before' ? period.start - 1 : period.end), moved]];
      if (pathPointIds.has(to.id)) return [[keyOf(from.id, to.id, period.start - 1), moved]];
      if (pathPointIds.has(from.id)) return [[keyOf(from.id, to.id, period.end), moved]];
      return [];
    }),
  );
}

/** The whole path was moved: its points and its line ends at the borders go by `shift`, everything else stays. */
function pathMoved(
  event: LineEndEvent,
  level: NonNullable<ReturnType<typeof heightLevelOf>>,
  period: Period,
  paths: readonly Path[],
  keyOf: BorderKeyOf,
) {
  const path = paths.find((candidate) => candidate.id === event.pathId);
  if (!path) return null;
  const pathIds = path.points.map(({ id }) => id);
  const onPath = new Set(pathIds);
  const others = paths.flatMap((candidate) => candidate.points.map(({ id }) => id)).filter((id) => !onPath.has(id));
  return {
    type: 'shiftPath' as const,
    level,
    heights: shiftedHeights(pathIds, others, event.offsets, event.shift),
    boundaries: movedBoundaries(event.lineEnds, onPath, period, event.shift, keyOf),
  };
}

/**
 * What the app does when a line was dragged. The line itself moves its whole path in this view: all points and all
 * line ends at the borders go by the distance, and every other point keeps its height. The arrow at the end of a line
 * moves only that end: where the line crosses the border. That holds for a line across the whole period as well, which
 * has two ends and runs smoothly from one to the other. In an overview (no level) nothing is kept.
 */
export function lineEndAction(
  event: LineEndEvent,
  period: Period | null,
  paths: readonly Path[],
  keyOf: BorderKeyOf,
): DemoAction | null {
  const level = heightLevelOf(period);
  if (level === null || period === null) return null;
  if (event.scope === 'path') return pathMoved(event, level, period, paths, keyOf);
  const { from, to } = event;
  if (!from.id || !to.id) return null;
  // The end at the start of the view lies on the border before the period, the other one on the border after it
  const inView = new Set(paths.flatMap((path) => path.points.map((point) => point.id)));
  const side = event.side ?? (inView.has(to.id) ? 'before' : 'after');
  const lastDay = side === 'before' ? period.start - 1 : period.end;
  return {
    type: 'boundaryHeight',
    level,
    key: keyOf(from.id, to.id, lastDay),
    height: event.y,
  };
}
