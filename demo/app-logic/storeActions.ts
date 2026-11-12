import { forgetHeights } from 'world-of-evolving-paths';
import type { DemoAction, DemoState } from './state';

type Of<T extends DemoAction['type']> = Extract<DemoAction, { type: T }>;

/**
 * The map moved something and handed over the new heights and places. Only these are taken: the store the map got
 * had statuses moved to another day, and that look must not become the data.
 */
const setLayout = (state: DemoState, { heights, free }: Of<'setLayout'>): DemoState => ({
  ...state,
  store: { ...state.store, heights, free },
});

/** Lets go of the heights the user set in a view: its points and arrows fall back to the week or the default. */
const resetView = (state: DemoState, { level, pointIds, arrowKeys }: Of<'resetView'>): DemoState => ({
  ...state,
  store: forgetHeights(state.store, level, pointIds, arrowKeys),
});

/** The actions that only change heights and places. */
export const storeActions = { setLayout, resetView };
