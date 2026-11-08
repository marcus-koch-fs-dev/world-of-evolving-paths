/** Items grouped by a key, in one pass. The order of the items inside a group stays as it was. */
export function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  return items.reduce((groups, item) => {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
    return groups;
  }, new Map<string, T[]>());
}
