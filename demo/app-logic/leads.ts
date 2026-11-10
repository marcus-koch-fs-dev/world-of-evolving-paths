import type { Lead } from 'world-of-evolving-paths';
import type { DemoPoint } from './types';

type Leads = { incoming?: Lead[]; outgoing?: Lead[] };

type Context = {
  byId: ReadonlyMap<string, DemoPoint>;
  /** The points that lead to each point. */
  previousOf: ReadonlyMap<string, readonly string[]>;
  /** Points the view shows. A chain ends there: it is a connection of the view. */
  shown: ReadonlySet<string>;
  /** Is the point inside the period? One that is inside but hidden (not important enough) is passed through. */
  isInPeriod(point: DemoPoint): boolean;
};

const byDate = (a: Lead, b: Lead) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title);

/**
 * The first points outside the period that a chain of hidden points leads to, following `neighbours`. A chain that
 * reaches a shown point is a connection of the view, so it gives nothing. `seen` keeps a circle from running forever.
 */
function firstOutside(
  ids: readonly string[],
  context: Context,
  neighbours: (id: string) => readonly string[],
  seen: Set<string>,
): Lead[] {
  return ids.flatMap((id) => {
    const point = context.byId.get(id);
    if (!point || seen.has(id) || context.shown.has(id)) return [];
    seen.add(id);
    if (context.isInPeriod(point)) return firstOutside(neighbours(id), context, neighbours, seen);
    return [{ title: point.title, date: point.date }];
  });
}

/** The same lead only once, oldest first. */
function tidy(leads: Lead[]): Lead[] {
  const unique = new Map(leads.map((lead) => [`${lead.date}|${lead.title}`, lead]));
  return [...unique.values()].sort(byDate);
}

/**
 * Finds, for a point of a view, where the path comes from and where it goes when that is outside the view:
 * the lines that leave the view. Only fields with something in them are returned.
 */
export function createLeadFinder(
  all: readonly DemoPoint[],
  shown: ReadonlySet<string>,
  isInPeriod: (point: DemoPoint) => boolean,
): (point: DemoPoint) => Leads {
  const previousOf = all.reduce((groups, point) => {
    point.next.forEach((id) => {
      groups.set(id, [...(groups.get(id) ?? []), point.id]);
    });
    return groups;
  }, new Map<string, string[]>());
  const context: Context = { byId: new Map(all.map((point) => [point.id, point])), previousOf, shown, isInPeriod };
  const nextOf = (id: string) => context.byId.get(id)?.next ?? [];
  const previousIds = (id: string) => context.previousOf.get(id) ?? [];

  return (point) => {
    const incoming = tidy(firstOutside(previousIds(point.id), context, previousIds, new Set([point.id])));
    const outgoing = tidy(firstOutside(point.next, context, nextOf, new Set([point.id])));
    return {
      ...(incoming.length > 0 ? { incoming } : {}),
      ...(outgoing.length > 0 ? { outgoing } : {}),
    };
  };
}
