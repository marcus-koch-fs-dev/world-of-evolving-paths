import { useState } from 'react';
import { fromDay, isIsoDate, type Period, periodOf, shiftPeriod, toDay, type ViewLevel } from 'world-of-evolving-paths';

import { popStep, pushStep } from '../app-logic/viewTrail';
import { useStoredState } from './useStoredState';

type View = { level: ViewLevel | null; period: Period };
// Where the user was before going into a finer view, so Back can return there
type Step = { view: View; page: number };

// The demo opens on the year, where the whole story of the paths is visible. A single week looks nearly empty.
const START_LEVEL: ViewLevel = 'year';

/** Which view is shown: the free view or a level, the period within it, and the page. */
export function useViewNavigation(today: string) {
  // How many years the year view spans. It is remembered, so the view comes back as the user left it.
  const [years, setStoredYears] = useStoredState<number>('wep-demo:years', 1);
  const build = (level: ViewLevel, date: string) => periodOf(level, date, level === 'year' ? { years } : {});

  const [view, setView] = useState<View>(() => ({ level: START_LEVEL, period: build(START_LEVEL, today) }));
  const [page, setPage] = useState(0);
  const [trail, setTrail] = useState<Step[]>([]);

  /** Switching level keeps today if it lies in the shown period, otherwise the start of that period. */
  const chooseLevel = (level: ViewLevel | null) => {
    setPage(0);
    if (level === null) return setView((current) => ({ ...current, level: null }));
    setView((current) => {
      const day = toDay(today);
      const keepsToday = current.level === null || (day >= current.period.start && day <= current.period.end);
      return { level, period: build(level, keepsToday ? today : fromDay(current.period.start)) };
    });
  };

  const move = (count: number) => {
    setPage(0);
    setView((current) => ({ ...current, period: shiftPeriod(current.period, count) }));
  };

  /** Today opens the week of today, whichever view was shown. */
  const goToToday = () => {
    setPage(0);
    setView({ level: 'week', period: build('week', today) });
  };

  /** Shows a level at a date, for example a week picked from a list. */
  const pick = (level: ViewLevel, date: string) => {
    if (!isIsoDate(date)) return;
    setPage(0);
    setView({ level, period: build(level, date) });
  };

  /** Shows the period of the same level that contains the date. */
  const goToDate = (date: string) => {
    if (view.level === null || !isIsoDate(date)) return;
    setPage(0);
    setView({ level: view.level, period: build(view.level, date) });
  };

  /** Changes how many years the year view spans. The shown year view keeps its last year. */
  const setYears = (count: number) => {
    setStoredYears(count);
    setView((current) =>
      current.level === 'year'
        ? { level: 'year', period: periodOf('year', fromDay(current.period.end), { years: count }) }
        : current,
    );
  };

  /** Goes into a finer level at a date, and remembers the view it came from. */
  const zoomInto = (level: ViewLevel, date: string) => {
    setTrail((steps) => pushStep(steps, { view, page }));
    setPage(0);
    setView({ level, period: build(level, date) });
  };

  /** Returns to the view before the last zoom. */
  const back = () => {
    const { step, rest } = popStep(trail);
    if (!step) return;
    setTrail(rest);
    setView(step.view);
    setPage(step.page);
  };

  return {
    level: view.level,
    period: view.period,
    years,
    page,
    setPage,
    setYears,
    chooseLevel,
    move,
    goToToday,
    goToDate,
    pick,
    zoomInto,
    back,
    canGoBack: trail.length > 0,
  };
}

export type ViewNavigation = ReturnType<typeof useViewNavigation>;
