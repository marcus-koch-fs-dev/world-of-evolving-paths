import type { ArrowElement, ItemElement, LevelBranch } from '../store/buildLevel.js';
import type { StorePoint } from '../store/types.js';
import type { Lead, PlacedPoint } from '../types.js';

/** A point of a branch before it has a place: with its height from the lane instead of an x and a y. */
export type PointPart = Omit<PlacedPoint, 'x' | 'y'> & { height: number };

export type ArrowPart = { key: string; side: 'before' | 'after'; pointId: string; far: Lead; height: number };

export type SpanPart = {
  branchId: string;
  before: { key: string; height: number };
  after: { key: string; height: number };
  from: Lead;
  to: Lead;
  strength?: number;
};

/** What one branch gives the view: its points, the arrows at the borders, and what connects to other branches. */
export type BranchParts = {
  pathId: string;
  points: PointPart[];
  arrows: ArrowPart[];
  /** `from` leads on to `to`: the point a fork leaves from leads on to the first point of the fork. */
  links: [from: string, to: string][];
  /** A line across the whole view, when the branch has no point in it. */
  span?: SpanPart;
};

const leadOf = (point: StorePoint): Lead => ({ title: point.title, date: point.date, id: point.id });

const isDrawn = (element: ItemElement): element is ItemElement<'point'> => element.type === 'point';

/** Turns the elements of a branch into points, arrows and connections. Elements of the branch stand in time order. */
export function branchParts(pathId: string, branch: LevelBranch): BranchParts {
  const before = branch.elements.find((e): e is ArrowElement => e.type === 'arrow' && e.side === 'before');
  const after = branch.elements.find((e): e is ArrowElement => e.type === 'arrow' && e.side === 'after');
  const items = branch.elements.filter((e): e is ItemElement => e.type !== 'arrow');
  const first = items[0];
  const last = items.at(-1);
  const points = items.flatMap((item, index): PointPart[] => {
    if (!isDrawn(item)) return [];
    const following = items[index + 1];
    const { point } = item;
    return [
      {
        id: point.id,
        pathId,
        branchId: branch.id,
        date: point.date,
        title: point.title,
        kind: point.kind,
        status: point.status,
        importance: point.prio,
        note: point.note,
        strength: point.strength,
        next: following && isDrawn(following) ? [following.point.id] : [],
        height: item.y,
      },
    ];
  });
  // The line comes in at the first element of the branch and leaves from the last one
  const arrows: ArrowPart[] = [
    ...(before && first && isDrawn(first)
      ? [{ key: before.key, side: before.side, pointId: first.point.id, far: leadOf(before.from), height: before.y }]
      : []),
    ...(after && last && last.type !== 'end'
      ? [{ key: after.key, side: after.side, pointId: last.point.id, far: leadOf(after.to), height: after.y }]
      : []),
  ];
  const firstOwn = items.find(isDrawn);
  return {
    pathId,
    points,
    arrows,
    links: first?.type === 'anchor' && firstOwn ? [[first.point.id, firstOwn.point.id]] : [],
    span:
      items.length === 0 && before && after
        ? {
            branchId: branch.id,
            before: { key: before.key, height: before.y },
            after: { key: after.key, height: after.y },
            from: leadOf(before.from),
            to: leadOf(after.to),
            strength: after.to.strength,
          }
        : undefined,
  };
}
