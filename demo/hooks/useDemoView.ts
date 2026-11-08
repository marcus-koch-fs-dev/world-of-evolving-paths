import { useMemo } from 'react';
import { fromDay, type PeriodMap } from 'world-of-evolving-paths';
import { buildPeriodData } from '../app-logic/periodData';
import type { DemoState } from '../app-logic/state';
import { viewRange } from '../app-logic/timeTravel';
import { useTimeTravel } from './useTimeTravel';
import type { ViewNavigation } from './useViewNavigation';

const FREE_VIEW = 'free';
const NO_PINS = {};

/**
 * Everything the map needs for the view that is shown: its key, the days the time slider reaches, time travel,
 * and the `PeriodMap` built from the app's data (with the positions the user pinned in this view).
 */
export function useDemoView(state: DemoState, navigation: ViewNavigation, today: string) {
  const period = navigation.level === null ? null : navigation.period;
  const view = period ? period.key : FREE_VIEW;
  // Pins and seeds are kept per view and page
  const tileKey = `${view}:p${navigation.page}`;
  const pins = state.pins[tileKey] ?? NO_PINS;

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
        pins,
      }),
    [state.paths, state.points, state.checkIns, travel.day, period, navigation.page, pins],
  );
  const periods = useMemo<PeriodMap>(() => ({ [view]: result.data }), [view, result.data]);

  return { period, view, tileKey, range, travel, result, periods };
}
