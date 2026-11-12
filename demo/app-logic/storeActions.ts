import { forgetHeights } from 'world-of-evolving-paths';
import type { DemoAction, DemoState } from './state';

type Of<T extends DemoAction['type']> = Extract<DemoAction, { type: T }>;

/**
 * The map moved something and handed over the paths it touched. Only their layout is taken: the store the map got
 * had statuses moved to another day, and that look must not become the data. This is where an app with a database
 * would save `changed`; the demo keeps them in its state.
 */
const setLayout = (state: DemoState, { changed }: Of<'setLayout'>): DemoState => {
  const layouts = new Map(changed.map((path) => [path.id, path.layout]));
  return {
    ...state,
    store: {
      ...state.store,
      paths: state.store.paths.map((path) => (layouts.has(path.id) ? { ...path, layout: layouts.get(path.id) } : path)),
    },
  };
};

/** Lets go of the heights the user set in a view: its points and arrows fall back to the week or the default. */
const resetView = (state: DemoState, { level, pointIds, arrowKeys }: Of<'resetView'>): DemoState => ({
  ...state,
  store: forgetHeights(state.store, level, pointIds, arrowKeys),
});

/** The actions that only change heights and places. */
export const storeActions = { setLayout, resetView };
