import type { BackgroundOptions } from 'world-of-evolving-paths';
import type { DockSlot } from 'world-of-evolving-paths/react';
import { accentFrom, DEFAULT_ACCENT } from '../app-logic/accent';
import type { UiSize } from '../app-logic/uiSize';
import { key } from './settingsProfile';
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

/** How the controls and the map look. */
export type LookValues = {
  /** How big the controls are: one of three fixed forms. */
  uiSize: UiSize;
  /** Bars and menus are see-through. */
  transparent: boolean;
  /** The accent color of the controls (`#rrggbb`), and whether what is switched on glows. */
  accent: string;
  glow: boolean;
};

// An older version of the demo could store an image in the background settings. It is dropped, it can be megabytes.
function withoutImage(stored: BackgroundOptions): BackgroundOptions {
  const { image: _image, ...rest } = stored as BackgroundOptions & { image?: unknown };
  return rest;
}

/** The settings about the look: size, see-through bars, accent color, background, and where the bars are docked. */
export function useLookSettings() {
  const [uiSize, setUiSize] = useStoredState<UiSize>(key('ui-size-v2'), 'small');
  const [transparent, setTransparent] = useStoredState<boolean>(key('transparent'), false);
  const [accent, setAccent] = useStoredState<string>(key('accent'), DEFAULT_ACCENT, accentFrom);
  const [glow, setGlow] = useStoredState<boolean>(key('glow'), false);
  const [background, setBackground] = useStoredState<BackgroundOptions>(
    key('background-v2'),
    DEFAULT_BACKGROUND,
    withoutImage,
  );
  const [docks, setDocks] = useStoredState<Docks>(key('docks'), DEFAULT_DOCKS);

  const values: LookValues = { uiSize, transparent, accent, glow };
  const change = (patch: Partial<LookValues>) => {
    if (patch.uiSize !== undefined) setUiSize(patch.uiSize);
    if (patch.transparent !== undefined) setTransparent(patch.transparent);
    if (patch.accent !== undefined) setAccent(patch.accent);
    if (patch.glow !== undefined) setGlow(patch.glow);
  };

  return { values, change, background, setBackground, docks, setDocks };
}
