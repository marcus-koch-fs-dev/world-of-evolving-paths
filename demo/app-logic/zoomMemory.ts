/** The layers of the map that each keep their own zoom: the three levels and the overview. */
export const zoomKeyOf = (level: string | null): string => level ?? 'all';

export type ZoomMemory = Readonly<Record<string, number>>;

/** A zoom that makes sense (a positive number), rounded so the stored value stays short. */
const clean = (zoom: number): number | null =>
  Number.isFinite(zoom) && zoom > 0 ? Math.round(zoom * 1000) / 1000 : null;

/** The memory with the zoom of one layer set. The same memory when nothing changes, so nothing is stored again. */
export function withZoom(memory: ZoomMemory, key: string, zoom: number): ZoomMemory {
  const value = clean(zoom);
  return value === null || memory[key] === value ? memory : { ...memory, [key]: value };
}

/** The stored memory, without anything that is not a zoom (old or damaged data). */
export const memoryFrom = (stored: unknown): ZoomMemory =>
  typeof stored === 'object' && stored !== null
    ? Object.fromEntries(
        Object.entries(stored).flatMap(([key, zoom]) => {
          const value = typeof zoom === 'number' ? clean(zoom) : null;
          return value === null ? [] : [[key, value]];
        }),
      )
    : {};
