/** The controls that can sit in the bar. Everything left out of the bar is a tile in the menu. */
export type BarItem = 'levels' | 'navigation' | 'paths' | 'back' | 'history';

export const BAR_ITEMS: readonly { id: BarItem; label: string; editorOnly?: boolean }[] = [
  { id: 'levels', label: 'View buttons (W, M, Y, All)' },
  { id: 'navigation', label: 'Arrows and Today' },
  { id: 'paths', label: 'Paths per page' },
  { id: 'back', label: 'Back' },
  { id: 'history', label: 'Undo and redo', editorOnly: true },
];

/** Ready-made choices: everything in the bar, or only the menu with the shown period (the calculator). */
export const BAR_PRESETS: Record<'bar' | 'tiles', readonly BarItem[]> = {
  bar: BAR_ITEMS.map((item) => item.id),
  tiles: [],
};

/** The bar items that make sense now: what only the editor uses is left out in map mode. */
export const barItemsFor = (items: readonly BarItem[], editing: boolean): BarItem[] =>
  items.filter((id) => editing || !BAR_ITEMS.some((item) => item.id === id && item.editorOnly));

/** A new order of the shown items, with the hidden ones kept behind them, so they come back when the editor does. */
export const withHiddenKept = (shown: readonly BarItem[], all: readonly BarItem[]): BarItem[] => [
  ...shown,
  ...all.filter((id) => !shown.includes(id)),
];

/** Should the menu close after a tile was clicked? `auto` closes on a touch screen and stays open with a mouse. */
export type MenuClose = 'auto' | 'always' | 'never';

export const MENU_CLOSE_CHOICES: readonly { value: MenuClose; label: string }[] = [
  { value: 'auto', label: 'Auto (closes on touch screens)' },
  { value: 'always', label: 'Always' },
  { value: 'never', label: 'Never' },
];

export const closesMenu = (choice: MenuClose, touchScreen: boolean): boolean =>
  choice === 'always' || (choice === 'auto' && touchScreen);

/** The bar items the user chose, in the order they chose. Unknown names from an old setting and doubles are dropped. */
export function barItemsFrom(stored: readonly string[]): BarItem[] {
  const known = new Set<string>(BAR_ITEMS.map((item) => item.id));
  return [...new Set(stored)].filter((id): id is BarItem => known.has(id));
}

/** Switches one item on (at the end of the bar) or off. The others keep their places. */
export function toggledBarItems(current: readonly BarItem[], item: BarItem, on: boolean): BarItem[] {
  const without = current.filter((id) => id !== item);
  return on ? [...without, item] : without;
}

/** Moves one item a step towards the start (-1) or the end (+1) of the bar. At the edge nothing changes. */
export function movedBarItem(current: readonly BarItem[], item: BarItem, step: -1 | 1): BarItem[] {
  const from = current.indexOf(item);
  const to = from + step;
  if (from < 0 || to < 0 || to >= current.length) return [...current];
  return current.map((id, index) => (index === from ? current[to] : index === to ? current[from] : id));
}

/** Which preset the items match, in the same order, or null when they are customized. */
export function presetOf(items: readonly BarItem[]): keyof typeof BAR_PRESETS | null {
  const same = (a: readonly BarItem[], b: readonly BarItem[]) =>
    a.length === b.length && a.every((id, i) => id === b[i]);
  return (
    (Object.keys(BAR_PRESETS) as (keyof typeof BAR_PRESETS)[]).find((name) => same(items, BAR_PRESETS[name])) ?? null
  );
}
