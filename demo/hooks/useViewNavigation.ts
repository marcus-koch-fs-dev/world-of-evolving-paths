import { useState } from 'react';
import { fromDay, isIsoDate, type Period, periodOf, shiftPeriod, toDay, type ViewLevel } from 'world-of-evolving-paths';

type View = { level: ViewLevel | null; period: Period };
// Where the user was before going into a finer view, so Back can return there
type Step = { view: View; page: number };

// The demo opens on the year, where the whole story of the paths is visible. A single week looks nearly empty.
const START_LEVEL: ViewLevel = 'year';

/** Which view is shown: the free view or a level, the period within it, and the page. */
export function useViewNavigation(today: string) {
  const [view, setView] = useState<View>(() => ({ level: START_LEVEL, period: periodOf(START_LEVEL, today) }));
  const [page, setPage] = useState(0);
  const [trail, setTrail] = useState<Step[]>([]);

  /** Switching level keeps today if it lies in the shown period, otherwise the start of that period. */
  const chooseLevel = (level: ViewLevel | null) => {
    setPage(0);
    if (level === null) return setView((current) => ({ ...current, level: null }));
    setView((current) => {
      const day = toDay(today);
      const keepsToday = current.level === null || (day >= current.period.start && day <= current.period.end);
      return { level, period: periodOf(level, keepsToday ? today : fromDay(current.period.start)) };
    });
  };

  const move = (count: number) => {
    setPage(0);
    setView((current) => ({ ...current, period: shiftPeriod(current.period, count) }));
  };

  const goToToday = () => {
    setPage(0);
    setView((current) => (current.level === null ? current : { ...current, period: periodOf(current.level, today) }));
  };

  /** Shows the period of the same level that contains the date. */
  const goToDate = (date: string) => {
    if (view.level === null || !isIsoDate(date)) return;
    setPage(0);
    setView({ level: view.level, period: periodOf(view.level, date) });
  };

  /** Goes into a finer level at a date, and remembers the view it came from. */
  const zoomInto = (level: ViewLevel, date: string) => {
    setTrail((steps) => [...steps, { view, page }]);
    setPage(0);
    setView({ level, period: periodOf(level, date) });
  };

  /** Returns to the view before the last zoom. */
  const back = () => {
    const last = trail.at(-1);
    if (!last) return;
    setTrail((steps) => steps.slice(0, -1));
    setView(last.view);
    setPage(last.page);
  };

  return {
    level: view.level,
    period: view.period,
    page,
    setPage,
    chooseLevel,
    move,
    goToToday,
    goToDate,
    zoomInto,
    back,
    canGoBack: trail.length > 0,
  };
}

export type ViewNavigation = ReturnType<typeof useViewNavigation>;
