import { useState } from 'react';
import {
  type BackgroundOptions,
  isValidLocale,
  type Orientation,
  VIEW_LEVELS,
  type ViewLevel,
} from 'world-of-evolving-paths';
import type { DockSlot } from 'world-of-evolving-paths/react';
import { DEFAULT_LEVELS } from '../app-logic/levels';
import { useStoredState } from './useStoredState';

/** Where the user docked the two bars. */
export type Docks = { main: DockSlot; time: DockSlot };
const DEFAULT_DOCKS: Docks = { main: 'top-left', time: 'bottom-left' };
// A soft gradient from purple to blue with a few stars, so the map does not look dark and heavy
const DEFAULT_BACKGROUND: BackgroundOptions = {
  fill: 'gradient',
  base: '#3a1f6b',
  color2: '#1f5a9e',
  angle: 150,
  pattern: 'stars',
  intensity: 0.5,
};
const FALLBACK_LOCALE = 'en-GB';

/** The settings the user can change in the settings panel. */
export type SettingsValues = {
  wavy: boolean;
  pointsLocked: boolean;
  /** Dragged and added points snap to a grid. */
  snap: boolean;
  animate: boolean;
  orientation: Orientation;
  /** The levels the view bar offers. */
  levels: ViewLevel[];
  locale: string;
  /** How many paths the free view shows on one page. 0 shows all of them. */
  allPaths: number;
};

// An older version of the demo could store an image in the background settings. It is dropped, it can be megabytes.
function withoutImage(stored: BackgroundOptions): BackgroundOptions {
  const { image: _image, ...rest } = stored as BackgroundOptions & { image?: unknown };
  return rest;
}

// Only levels that exist count, an old setting may hold others. Without any of them the defaults are used.
function onlyKnownLevels(stored: ViewLevel[]): ViewLevel[] {
  const kept = stored.filter((level) => VIEW_LEVELS.some((option) => option.level === level));
  return kept.length > 0 ? kept : DEFAULT_LEVELS;
}

/** The demo's settings: some are remembered in the browser, some start fresh on every load. */
export function useDemoSettings() {
  const [wavy, setWavy] = useState(false);
  const [pointsLocked, setPointsLocked] = useState(false);
  const [snap, setSnap] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [levels, setLevels] = useStoredState<ViewLevel[]>('wep-demo:levels-v2', DEFAULT_LEVELS, onlyKnownLevels);
  const [orientation, setOrientation] = useStoredState<Orientation>('wep-demo:orientation', 'auto');
  const [storedLocale, setLocale] = useStoredState<string>('wep-demo:locale', navigator.language || FALLBACK_LOCALE);
  const [background, setBackground] = useStoredState<BackgroundOptions>(
    'wep-demo:background',
    DEFAULT_BACKGROUND,
    withoutImage,
  );
  const [customColors, setCustomColors] = useStoredState<string[]>('wep-demo:custom-colors', []);
  const [docks, setDocks] = useStoredState<Docks>('wep-demo:docks', DEFAULT_DOCKS);
  const [allPaths, setAllPaths] = useStoredState<number>('wep-demo:all-paths', 0);

  const values: SettingsValues = {
    wavy,
    pointsLocked,
    snap,
    animate,
    orientation,
    levels,
    locale: isValidLocale(storedLocale) ? storedLocale : FALLBACK_LOCALE,
    allPaths,
  };

  /** Applies the changed settings; each one goes to where it is kept. */
  const change = (patch: Partial<SettingsValues>) => {
    if (patch.wavy !== undefined) setWavy(patch.wavy);
    if (patch.pointsLocked !== undefined) setPointsLocked(patch.pointsLocked);
    if (patch.snap !== undefined) setSnap(patch.snap);
    if (patch.animate !== undefined) setAnimate(patch.animate);
    if (patch.orientation !== undefined) setOrientation(patch.orientation);
    if (patch.levels !== undefined) setLevels(patch.levels);
    if (patch.locale !== undefined) setLocale(patch.locale);
    if (patch.allPaths !== undefined) setAllPaths(patch.allPaths);
  };

  return { values, change, background, setBackground, customColors, setCustomColors, docks, setDocks };
}
