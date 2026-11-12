import { laneOffsets } from '../layout.js';
import type { PlacedWorld } from '../types.js';
import { LINE_GAP, leadBaseY, leadEndX, leadKey, THROUGH_SPREAD, throughKey } from './lineGeometry.js';
import { viewEdges } from './viewEdges.js';

/**
 * A line that runs along the time axis between two x positions, at the y it would like to have.
 * `fixed` lines span the whole view and are placed before the others. An `exact` line was put at its y by the user
 * and stays exactly there: it neither moves for other lines nor makes them move.
 */
export type Track = { key: string; x0: number; x1: number; y: number; fixed: boolean; exact?: boolean };

/** The y that every such line gets. */
export type Tracks = ReadonlyMap<string, number>;

/** Heights the user is dragging lines to right now, by the key of the line. */
export type TrackOverrides = ReadonlyMap<string, number>;

const overlapsInX = (a: Track, b: Track) => a.x0 < b.x1 && b.x0 < a.x1;
const rank = (track: Track) => (track.fixed ? 0 : 1);
// Plain code unit order: the same on every machine, unlike localeCompare
const compareKeys = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Puts the lines that run along the time axis (the lines that leave a view or span it) on tracks of their own:
 * lines that cover the same stretch of time keep at least `LINE_GAP` between them. They are placed from top to
 * bottom; a line that would lie too close to one already placed moves down to the next free place.
 * Lines the user put at a height (`exact`) are left out: they take the y they were given, and lines may cross them. The
 * other lines that span the whole view (`fixed`) come first, the rest yields.
 */
export function separateTracks(tracks: readonly Track[], gap = LINE_GAP): Map<string, number> {
  const ordered = tracks
    .filter((track) => !track.exact)
    .sort((a, b) => rank(a) - rank(b) || a.y - b.y || compareKeys(a.key, b.key));
  const placed = ordered.reduce<Track[]>((done, track) => {
    const free = (y: number): number => {
      const clash = done.find((other) => overlapsInX(track, other) && Math.abs(other.y - y) < gap);
      return clash ? free(clash.y + gap) : y;
    };
    done.push({ ...track, y: free(track.y) });
    return done;
  }, []);
  const given = tracks.filter((track) => track.exact);
  return new Map([...given, ...placed].map((track) => [track.key, track.y]));
}

/** The lines of a view that run along the time axis, with the y each would like to have. */
function wantedTracks(world: PlacedWorld, overrides: TrackOverrides): Track[] {
  const edges = viewEdges(world);
  if (!edges) return [];
  const withPoints = new Set(world.points.map((point) => point.pathId));
  const lanes = laneOffsets(world.paths);
  /**
   * The height the user chose for a line: while dragging (in the world) or kept in the data (a distance from the lane
   * of its path).
   */
  const chosen = (key: string, kept: number | undefined, pathId: string) =>
    overrides.get(key) ?? (kept === undefined ? undefined : (lanes.get(pathId) ?? 0) + kept);
  const spanning = world.paths.flatMap((path) => {
    const throughs = path.through ?? [];
    const places = throughs.length + (withPoints.has(path.id) ? 1 : 0);
    const first = places - throughs.length;
    return throughs.map((through, index): Track => {
      const key = throughKey(path.id, index);
      const lane = lanes.get(path.id) ?? 0;
      // A line with heights at its two ends is drawn from one to the other: its height here is in the middle of them.
      // With only one end moved, the other end stays where the line was, so moving one end never moves both
      const ends = [through.yStart, through.yEnd].filter((height) => height !== undefined);
      const middleOfEnds = ends.length < 2 ? undefined : lane + (ends[0] + ends[1]) / 2;
      const picked = chosen(key, through.y, path.id);
      return {
        key,
        x0: edges.left,
        x1: edges.right,
        y: picked ?? middleOfEnds ?? lane + (first + index - (places - 1) / 2) * THROUGH_SPREAD,
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
        const picked = chosen(key, lead.y, point.pathId);
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
