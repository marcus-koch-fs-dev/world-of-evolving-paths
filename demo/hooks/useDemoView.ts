import { useMemo } from 'react';
import { createStoreCache, fromDay, pathsInView, placeLevel } from 'world-of-evolving-paths';
import { withLook } from '../app-logic/appearance';
import { heightLevelOf } from '../app-logic/heightLevel';
import { pagesOf } from '../app-logic/paging';
import type { DemoState } from '../app-logic/state';
import { viewRange } from '../app-logic/timeTravel';
import { useTimeTravel } from './useTimeTravel';
import type { ViewNavigation } from './useViewNavigation';

const FREE_VIEW = 'free';

/** How many paths a page shows, in every view. */
const pageSizeOf = (pathsPerPage: number) => Math.max(1, pathsPerPage);

/**
 * Everything the map needs for the view that is shown: its key, the days the time slider reaches, time travel, the
 * paths of the page, and the store with the look of the day (statuses and strength).
 */
export function useDemoView(state: DemoState, navigation: ViewNavigation, today: string, pathsPerPage: number) {
  const period = navigation.level === null ? null : navigation.period;
  const view = period ? period.key : FREE_VIEW;
  const tileKey = `${view}:p${navigation.page}`;
  // An overview (the free view, several years) keeps no heights
  const level = heightLevelOf(period);
  // Remembers what was worked out for paths that did not change
  const cache = useMemo(() => createStoreCache(), []);

  const range = useMemo(
    () =>
      viewRange(
        period,
        state.store.paths.flatMap((path) =>
          path.branches.flatMap((branch) => branch.points.map((point) => point.date)),
        ),
        today,
      ),
    [period, state.store.paths, today],
  );
  const travel = useTimeTravel({ view, today, range });

  const asOf = travel.day === null ? undefined : fromDay(travel.day);
  const store = useMemo(() => withLook(state.store, asOf), [state.store, asOf]);

  // The paths that have something in this view, a few of them on each page
  const pages = useMemo(
    () => pagesOf(pathsInView(state.store, view, cache), pageSizeOf(pathsPerPage)),
    [state.store, view, pathsPerPage, cache],
  );
  const page = Math.min(Math.max(0, navigation.page), Math.max(0, pages.length - 1));
  const pathIds = useMemo(() => pages[page] ?? [], [pages, page]);

  // What is in view, for the selection and for the reset of the heights
  const shown = useMemo(
    () => placeLevel(store, view, travel.shownToday, pathIds, cache),
    [store, view, travel.shownToday, pathIds, cache],
  );
  const visibleIds = useMemo(() => new Set(shown.points.map((point) => point.id)), [shown]);
  const arrowKeys = useMemo(
    () => [
      ...shown.arrows.map((arrow) => arrow.key),
      ...shown.spans.flatMap((span) => [span.before.key, span.after.key]),
    ],
    [shown],
  );

  return {
    period,
    level,
    view,
    tileKey,
    range,
    travel,
    store,
    pathIds,
    paging: { page, pages: Math.max(1, pages.length) },
    visibleIds,
    arrowKeys,
  };
}
