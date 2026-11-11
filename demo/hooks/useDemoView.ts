import { useMemo } from 'react';
import { fromDay, type PeriodMap } from 'world-of-evolving-paths';
import { buildPeriodData } from '../app-logic/periodData';
import type { DemoState } from '../app-logic/state';
import { viewRange } from '../app-logic/timeTravel';
import { useTimeTravel } from './useTimeTravel';
import type { ViewNavigation } from './useViewNavigation';

const FREE_VIEW = 'free';
const NO_EDGES = {};

/**
 * Everything the map needs for the view that is shown: its key, the days the time slider reaches, time travel,
 * and the `PeriodMap` built from the app's data (with the heights the user chose).
 */
export function useDemoView(state: DemoState, navigation: ViewNavigation, today: string) {
  const period = navigation.level === null ? null : navigation.period;
  const view = period ? period.key : FREE_VIEW;
  // Seeds are kept per view and page, the heights where paths cross the edge per period
  const tileKey = `${view}:p${navigation.page}`;
  const edgeHeights = state.edgeHeights[view] ?? NO_EDGES;

  const range = useMemo(
    () =>
      viewRange(
        period,
        state.points.map((point) => point.date),
        today,
      ),
    [period, state.points, today],
  );
  const travel = useTimeTravel({ view, today, range });

  const result = useMemo(
    () =>
      buildPeriodData({
        paths: state.paths,
        points: state.points,
        checkIns: state.checkIns,
        asOf: travel.day === null ? undefined : fromDay(travel.day),
        period,
        page: navigation.page,
        heights: state.heights,
        edgeHeights,
      }),
    [state.paths, state.points, state.checkIns, state.heights, edgeHeights, travel.day, period, navigation.page],
  );
  const periods = useMemo<PeriodMap>(() => ({ [view]: result.data }), [view, result.data]);

  return { period, view, tileKey, range, travel, result, periods };
}
