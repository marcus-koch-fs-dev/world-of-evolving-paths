export type BoundedCache<V> = {
  /** The value for a key. It is made once; when the cache is full the oldest value is dropped. */
  get(key: string, make: () => V): V;
  size(): number;
};

/** A cache that never grows past `limit` entries, so changing inputs (colors, sizes) cannot fill memory. */
export function createBoundedCache<V>(limit: number): BoundedCache<V> {
  const entries = new Map<string, V>();
  return {
    get(key, make) {
      const known = entries.get(key);
      if (known !== undefined) return known;
      const value = make();
      entries.set(key, value);
      if (entries.size > limit) entries.delete(entries.keys().next().value as string);
      return value;
    },
    size: () => entries.size,
  };
}
