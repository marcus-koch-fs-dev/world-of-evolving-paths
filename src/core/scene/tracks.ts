import { laneOffsets } from '../layout.js';
import type { PlacedWorld } from '../types.js';
import { LINE_GAP, leadBaseY, leadEndX, leadKey, THROUGH_SPREAD, throughKey } from './lineGeometry.js';
import { viewEdges } from './viewEdges.js';

/**
 * A line that runs along the time axis between two x positions, at the y it would like to have.
 * `fixed` lines span the whole view and are placed before the others. An `exact` line was put at its y by the user
 * and stays there: the others make room for it.
 */
export type Track = { key: string; x0: number; x1: number; y: number; fixed: boolean; exact?: boolean };

/** The y that every such line gets. */
export type Tracks = ReadonlyMap<string, number>;

/** Heights the user is dragging lines to right now, by the key of the line. */
export type TrackOverrides = ReadonlyMap<string, number>;

const overlapsInX = (a: Track, b: Track) => a.x0 < b.x1 && b.x0 < a.x1;
const rank = (track: Track) => (track.exact ? 0 : track.fixed ? 1 : 2);

/**
 * Puts the lines that run along the time axis (the lines that leave a view or span it) on tracks of their own:
 * lines that cover the same stretch of time keep at least `LINE_GAP` between them. They are placed from top to
 * bottom; a line that would lie too close to one already placed moves down to the next free place.
 * Lines the user put at a height (`exact`) keep it. Lines that span the whole view (`fixed`) come next, the rest yields.
 */
export function separateTracks(tracks: readonly Track[], gap = LINE_GAP): Map<string, number> {
  const ordered = [...tracks].sort((a, b) => rank(a) - rank(b) || a.y - b.y || a.key.localeCompare(b.key));
  const placed = ordered.reduce<Track[]>((done, track) => {
    const free = (y: number): number => {
      const clash = done.find((other) => overlapsInX(track, other) && Math.abs(other.y - y) < gap);
      return clash ? free(clash.y + gap) : y;
    };
    done.push({ ...track, y: track.exact ? track.y : free(track.y) });
    return done;
  }, []);
  return new Map(placed.map((track) => [track.key, track.y]));
}

/** The lines of a view that run along the time axis, with the y each would like to have. */
function wantedTracks(world: PlacedWorld, overrides: TrackOverrides): Track[] {
  const edges = viewEdges(world);
  if (!edges) return [];
  const withPoints = new Set(world.points.map((point) => point.pathId));
  const lanes = laneOffsets(world.paths);
  /** The height the user chose for a line, while dragging or kept in the data. */
  const chosen = (key: string, kept: number | undefined) => overrides.get(key) ?? kept;
  const spanning = world.paths.flatMap((path) => {
    const throughs = path.through ?? [];
    const places = throughs.length + (withPoints.has(path.id) ? 1 : 0);
    const first = places - throughs.length;
    return throughs.map((through, index): Track => {
      const key = throughKey(path.id, index);
      const picked = chosen(key, through.y);
      return {
        key,
        x0: edges.left,
        x1: edges.right,
        y: picked ?? (lanes.get(path.id) ?? 0) + (first + index - (places - 1) / 2) * THROUGH_SPREAD,
        fixed: true,
        exact: picked !== undefined,
      };
    });
  });
  const leaving = world.points.flatMap((point) =>
    (['before', 'after'] as const).flatMap((side) => {
      const leads = (side === 'before' ? point.incoming : point.outgoing) ?? [];
      const end = leadEndX(world, point, side);
      return leads.map((lead, index): Track => {
        const key = leadKey(side, point.id, index);
        const picked = chosen(key, lead.y);
        return {
          key,
          x0: Math.min(point.x, end),
          x1: Math.max(point.x, end),
          y: picked ?? leadBaseY(point, lanes.get(point.pathId), index, leads.length),
          fixed: false,
          exact: picked !== undefined,
        };
      });
    }),
  );
  return [...spanning, ...leaving];
}

/** The y of every line that runs along the time axis in a world, keyed by `leadKey` and `throughKey`. */
export function lineTracks(world: PlacedWorld, overrides: TrackOverrides = new Map()): Tracks {
  return separateTracks(wantedTracks(world, overrides));
}
