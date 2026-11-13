import { useState } from 'react';
import {
  type BackgroundOptions,
  isValidLocale,
  type Orientation,
  VIEW_LEVELS,
  type ViewLevel,
} from 'world-of-evolving-paths';
import type { DockSlot } from 'world-of-evolving-paths/react';
import { accentFrom, DEFAULT_ACCENT } from '../app-logic/accent';
import { BAR_PRESETS, type BarItem, barItemsFrom, type MenuClose } from '../app-logic/controls';
import { isEmbedded, profileOf, settingKey } from '../app-logic/device';
import { DEFAULT_LEVELS } from '../app-logic/levels';
import type { UiSize } from '../app-logic/uiSize';
import { useStoredState } from './useStoredState';

/** Where the user docked the two bars. */
export type Docks = { main: DockSlot; time: DockSlot };
const DEFAULT_DOCKS: Docks = { main: 'top-left', time: 'bottom-left' };
// A soft gradient from purple to blue with a few stars, so the map does not look dark and heavy
const DEFAULT_BACKGROUND: BackgroundOptions = {
  fill: 'gradient',
  base: '#4e2c86',
  color2: '#2a70be',
  angle: 150,
  pattern: 'stars',
  intensity: 0.5,
};
const FALLBACK_LOCALE = 'en-GB';
// On a phone the bar starts with only the menu, there is no room for more
const PROFILE = profileOf(isEmbedded(window.location.search), window.matchMedia('(max-width: 600px)').matches);
const key = (name: string) => settingKey(PROFILE, name);
const DEFAULT_BAR_ITEMS: readonly BarItem[] = PROFILE === 'mobile' ? BAR_PRESETS.tiles : BAR_PRESETS.bar;

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
  /** How many paths one page shows, in every view. */
  pathsPerPage: number;
  /** How big the controls are, and the number of percent when it is `custom`. */
  uiSize: UiSize;
  /** Bars and menus are see-through. */
  transparent: boolean;
  /** The accent color of the controls (`#rrggbb`), and whether what is switched on glows. */
  accent: string;
  glow: boolean;
  /** The bar with the time slider, and the info (legend) at the edge. They can be hidden. */
  timeBar: boolean;
  legend: boolean;
  /** The controls that sit in the bar. All of them are also tiles in the menu. */
  barItems: BarItem[];
  /** Whether the menu closes after a tile was clicked. */
  menuClose: MenuClose;
  /** The point menu closes after the user changed something. */
  pointMenuCloses: boolean;
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
  const [levels, setLevels] = useStoredState<ViewLevel[]>(key('levels-v2'), DEFAULT_LEVELS, onlyKnownLevels);
  const [orientation, setOrientation] = useStoredState<Orientation>(key('orientation'), 'auto');
  const [storedLocale, setLocale] = useStoredState<string>('wep-demo:locale', navigator.language || FALLBACK_LOCALE);
  const [background, setBackground] = useStoredState<BackgroundOptions>(
    key('background-v2'),
    DEFAULT_BACKGROUND,
    withoutImage,
  );
  const [customColors, setCustomColors] = useStoredState<string[]>('wep-demo:custom-colors', []);
  const [docks, setDocks] = useStoredState<Docks>(key('docks'), DEFAULT_DOCKS);
  const [pathsPerPage, setPathsPerPage] = useStoredState<number>(key('paths-per-page'), 2);
  const [uiSize, setUiSize] = useStoredState<UiSize>(key('ui-size-v2'), 'small');
  const [accent, setAccent] = useStoredState<string>(key('accent'), DEFAULT_ACCENT, accentFrom);
  const [glow, setGlow] = useStoredState<boolean>(key('glow'), false);
  const [timeBar, setTimeBar] = useStoredState<boolean>(key('time-bar'), true);
  const [legend, setLegend] = useStoredState<boolean>(key('legend'), true);
  const [transparent, setTransparent] = useStoredState<boolean>(key('transparent'), false);
  const [barItems, setBarItems] = useStoredState<BarItem[]>(key('bar-items'), [...DEFAULT_BAR_ITEMS], barItemsFrom);
  const [menuClose, setMenuClose] = useStoredState<MenuClose>(key('menu-close'), 'auto');
  const [pointMenuCloses, setPointMenuCloses] = useStoredState<boolean>(key('point-menu-closes'), true);

  const values: SettingsValues = {
    wavy,
    pointsLocked,
    snap,
    animate,
    orientation,
    levels,
    locale: isValidLocale(storedLocale) ? storedLocale : FALLBACK_LOCALE,
    pathsPerPage,
    uiSize,
    transparent,
    accent,
    glow,
    timeBar,
    legend,
    barItems,
    menuClose,
    pointMenuCloses,
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
    if (patch.pathsPerPage !== undefined) setPathsPerPage(patch.pathsPerPage);
    if (patch.uiSize !== undefined) setUiSize(patch.uiSize);
    if (patch.transparent !== undefined) setTransparent(patch.transparent);
    if (patch.accent !== undefined) setAccent(patch.accent);
    if (patch.glow !== undefined) setGlow(patch.glow);
    if (patch.timeBar !== undefined) setTimeBar(patch.timeBar);
    if (patch.legend !== undefined) setLegend(patch.legend);
    if (patch.barItems !== undefined) setBarItems(patch.barItems);
    if (patch.menuClose !== undefined) setMenuClose(patch.menuClose);
    if (patch.pointMenuCloses !== undefined) setPointMenuCloses(patch.pointMenuCloses);
  };

  return { values, change, background, setBackground, customColors, setCustomColors, docks, setDocks };
}
