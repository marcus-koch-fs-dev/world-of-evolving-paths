import type { SubPlacement } from 'world-of-evolving-paths/react';
import { BAR_PRESETS, type BarItem } from '../app-logic/controls';
import { isEmbedded, profileOf, settingKey } from '../app-logic/device';

// Which set of settings the page uses: the phone (a narrow page or the phone frame) has its own. Decided once per load.
const PROFILE = profileOf(isEmbedded(window.location.search), window.matchMedia('(max-width: 600px)').matches);

/** The key a setting is stored under, for the set of settings of this page. */
export const key = (name: string) => settingKey(PROFILE, name);

// On a phone the bar starts with only the menu, there is no room for more
export const DEFAULT_BAR_ITEMS: readonly BarItem[] = PROFILE === 'mobile' ? BAR_PRESETS.tiles : BAR_PRESETS.bar;

// The panel of a point menu opens beside the tiles; on a phone it opens below them, where there is more room
export const DEFAULT_SUB_PLACEMENT: SubPlacement = PROFILE === 'mobile' ? 'below' : 'right';
