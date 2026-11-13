import { useState } from 'react';
import { isValidLocale, type Orientation, VIEW_LEVELS, type ViewLevel } from 'world-of-evolving-paths';
import { DEFAULT_LEVELS } from '../app-logic/levels';
import { memoryFrom, withZoom, type ZoomMemory } from '../app-logic/zoomMemory';
import { key } from './settingsProfile';
import { useStoredState } from './useStoredState';

const FALLBACK_LOCALE = 'en-GB';

/** How the map behaves: the time, the views, the zoom and what the user may do with points. */
export type MapValues = {
  wavy: boolean;
  pointsLocked: boolean;
  /** Dragged and added points snap to a grid. */
  snap: boolean;
  animate: boolean;
  orientation: Orientation;
  /** The levels the view bar offers. */
  levels: ViewLevel[];
  locale: string;
  /** How many paths one page shows, in every view. */
  pathsPerPage: number;
  /** Each layer (week, month, year, all) comes back at the zoom it last had. */
  rememberZoom: boolean;
};

// Only levels that exist count, an old setting may hold others. Without any of them the defaults are used.
function onlyKnownLevels(stored: ViewLevel[]): ViewLevel[] {
  const kept = stored.filter((level) => VIEW_LEVELS.some((option) => option.level === level));
  return kept.length > 0 ? kept : DEFAULT_LEVELS;
}

/** The settings about the map. Some are remembered in the browser, some start fresh on every load. */
export function useMapSettings() {
  const [wavy, setWavy] = useState(false);
  const [pointsLocked, setPointsLocked] = useState(false);
  const [snap, setSnap] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [levels, setLevels] = useStoredState<ViewLevel[]>(key('levels-v2'), DEFAULT_LEVELS, onlyKnownLevels);
  const [orientation, setOrientation] = useStoredState<Orientation>(key('orientation'), 'auto');
  const [storedLocale, setLocale] = useStoredState<string>('wep-demo:locale', navigator.language || FALLBACK_LOCALE);
  const [pathsPerPage, setPathsPerPage] = useStoredState<number>(key('paths-per-page'), 2);
  const [rememberZoom, setRememberZoom] = useStoredState<boolean>(key('remember-zoom'), true);
  const [zooms, setZooms] = useStoredState<ZoomMemory>(key('zoom-by-layer'), {}, memoryFrom);

  const values: MapValues = {
    wavy,
    pointsLocked,
    snap,
    animate,
    orientation,
    levels,
    locale: isValidLocale(storedLocale) ? storedLocale : FALLBACK_LOCALE,
    pathsPerPage,
    rememberZoom,
  };
  const change = (patch: Partial<MapValues>) => {
    if (patch.wavy !== undefined) setWavy(patch.wavy);
    if (patch.pointsLocked !== undefined) setPointsLocked(patch.pointsLocked);
    if (patch.snap !== undefined) setSnap(patch.snap);
    if (patch.animate !== undefined) setAnimate(patch.animate);
    if (patch.orientation !== undefined) setOrientation(patch.orientation);
    if (patch.levels !== undefined) setLevels(patch.levels);
    if (patch.locale !== undefined) setLocale(patch.locale);
    if (patch.pathsPerPage !== undefined) setPathsPerPage(patch.pathsPerPage);
    if (patch.rememberZoom !== undefined) setRememberZoom(patch.rememberZoom);
  };

  /** Remembers the zoom of a layer. */
  const rememberLayerZoom = (layer: string, zoom: number) => setZooms((memory) => withZoom(memory, layer, zoom));

  return { values, change, zooms, rememberLayerZoom };
}
