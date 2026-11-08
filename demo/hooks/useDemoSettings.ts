import { useState } from 'react';
import { type BackgroundOptions, isValidLocale, type Orientation, type ViewLevel } from 'world-of-evolving-paths';
import type { DockSlot } from 'world-of-evolving-paths/react';
import { DEFAULT_LEVELS } from '../app-logic/levels';
import { useStoredState } from './useStoredState';

/** Where the user docked the two bars. */
export type Docks = { main: DockSlot; time: DockSlot };
const DEFAULT_DOCKS: Docks = { main: 'top-left', time: 'bottom-left' };
const DEFAULT_BACKGROUND: BackgroundOptions = { pattern: 'stars', intensity: 0.5 };
const FALLBACK_LOCALE = 'en-GB';

/** The settings the user can change in the settings panel. */
export type SettingsValues = {
  wavy: boolean;
  pointsLocked: boolean;
  animate: boolean;
  orientation: Orientation;
  /** The levels the view bar offers. */
  levels: ViewLevel[];
  locale: string;
};

// An older version of the demo could store an image in the background settings. It is dropped, it can be megabytes.
function withoutImage(stored: BackgroundOptions): BackgroundOptions {
  const { image: _image, ...rest } = stored as BackgroundOptions & { image?: unknown };
  return rest;
}

/** The demo's settings: some are remembered in the browser, some start fresh on every load. */
export function useDemoSettings() {
  const [wavy, setWavy] = useState(false);
  const [pointsLocked, setPointsLocked] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [levels, setLevels] = useStoredState<ViewLevel[]>('wep-demo:levels', DEFAULT_LEVELS);
  const [orientation, setOrientation] = useStoredState<Orientation>('wep-demo:orientation', 'auto');
  const [storedLocale, setLocale] = useStoredState<string>('wep-demo:locale', navigator.language || FALLBACK_LOCALE);
  const [background, setBackground] = useStoredState<BackgroundOptions>(
    'wep-demo:background',
    DEFAULT_BACKGROUND,
    withoutImage,
  );
  const [customColors, setCustomColors] = useStoredState<string[]>('wep-demo:custom-colors', []);
  const [docks, setDocks] = useStoredState<Docks>('wep-demo:docks', DEFAULT_DOCKS);

  const values: SettingsValues = {
    wavy,
    pointsLocked,
    animate,
    orientation,
    levels,
    locale: isValidLocale(storedLocale) ? storedLocale : FALLBACK_LOCALE,
  };

  /** Applies the changed settings; each one goes to where it is kept. */
  const change = (patch: Partial<SettingsValues>) => {
    if (patch.wavy !== undefined) setWavy(patch.wavy);
    if (patch.pointsLocked !== undefined) setPointsLocked(patch.pointsLocked);
    if (patch.animate !== undefined) setAnimate(patch.animate);
    if (patch.orientation !== undefined) setOrientation(patch.orientation);
    if (patch.levels !== undefined) setLevels(patch.levels);
    if (patch.locale !== undefined) setLocale(patch.locale);
  };

  return { values, change, background, setBackground, customColors, setCustomColors, docks, setDocks };
}
