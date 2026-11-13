import type { SubPlacement } from 'world-of-evolving-paths/react';
import { type BarItem, barItemsFrom, type MenuClose } from '../app-logic/controls';
import { DEFAULT_BAR_ITEMS, DEFAULT_SUB_PLACEMENT, key } from './settingsProfile';
import { useStoredState } from './useStoredState';

/** Which controls there are and how they behave. */
export type ControlValues = {
  /** The controls that sit in the bar, in their order. All of them are also tiles in the menu. */
  barItems: BarItem[];
  /** Whether the menu closes after a tile was clicked. */
  menuClose: MenuClose;
  /** The bar with the time slider, and the info (legend) at the edge. They can be hidden. */
  timeBar: boolean;
  legend: boolean;
  /** The point menu closes after the user changed something. */
  pointMenuCloses: boolean;
  /** Where the panel of a tile in the point menu opens. The user turns it with a button in the menu. */
  pointPanel: SubPlacement;
  /** The keys of the page and the map (1 to 4, T, arrows, +, −, M, E, Ctrl+Z) work. Single keys can be switched off. */
  keyboardShortcuts: boolean;
};

/** The settings about the controls: the bar, the menu, the other bars and the keys. */
export function useControlSettings() {
  const [barItems, setBarItems] = useStoredState<BarItem[]>(key('bar-items'), [...DEFAULT_BAR_ITEMS], barItemsFrom);
  const [menuClose, setMenuClose] = useStoredState<MenuClose>(key('menu-close'), 'auto');
  const [timeBar, setTimeBar] = useStoredState<boolean>(key('time-bar'), true);
  const [legend, setLegend] = useStoredState<boolean>(key('legend'), true);
  const [pointMenuCloses, setPointMenuCloses] = useStoredState<boolean>(key('point-menu-closes'), true);
  const [pointPanel, setPointPanel] = useStoredState<SubPlacement>(key('point-panel'), DEFAULT_SUB_PLACEMENT);
  const [keyboardShortcuts, setKeyboardShortcuts] = useStoredState<boolean>(key('keyboard-shortcuts'), true);

  const values: ControlValues = {
    barItems,
    menuClose,
    timeBar,
    legend,
    pointMenuCloses,
    pointPanel,
    keyboardShortcuts,
  };
  const change = (patch: Partial<ControlValues>) => {
    if (patch.barItems !== undefined) setBarItems(patch.barItems);
    if (patch.menuClose !== undefined) setMenuClose(patch.menuClose);
    if (patch.timeBar !== undefined) setTimeBar(patch.timeBar);
    if (patch.legend !== undefined) setLegend(patch.legend);
    if (patch.pointMenuCloses !== undefined) setPointMenuCloses(patch.pointMenuCloses);
    if (patch.pointPanel !== undefined) setPointPanel(patch.pointPanel);
    if (patch.keyboardShortcuts !== undefined) setKeyboardShortcuts(patch.keyboardShortcuts);
  };

  return { values, change };
}
