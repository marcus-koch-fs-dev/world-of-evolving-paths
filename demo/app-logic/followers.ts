/** A point of the view as far as the links go: its id and the ids it leads to. */
type Linked = { id: string; next: readonly string[] };

/**
 * The points that come after a point in a view, by the connections: everything it leads to, and what that leads to.
 * These are the points that follow it in the layout, so they move along when it is moved.
 */
export function followersOf(points: readonly Linked[], id: string): string[] {
  const nextOf = new Map(points.map((point) => [point.id, point.next]));
  // One step further for the whole front at a time, so every point is looked at once
  const walk = (front: readonly string[], seen: Set<string>): Set<string> => {
    const fresh = [...new Set(front.flatMap((from) => nextOf.get(from) ?? []))].filter((next) => !seen.has(next));
    fresh.forEach((next) => {
      seen.add(next);
    });
    return fresh.length === 0 ? seen : walk(fresh, seen);
  };
  return [...walk([id], new Set([id]))].filter((other) => other !== id);
}
