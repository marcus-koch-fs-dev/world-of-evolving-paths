import { useState } from 'react';
import { fromDay, type Period, periodOf, shiftPeriod, toDay, type ViewLevel } from 'world-of-evolving-paths';

type View = { level: ViewLevel | null; period: Period };

/** Which view is shown: the free view or a level, the period within it, and the page. */
export function useViewNavigation(today: string) {
  const [view, setView] = useState<View>(() => ({ level: 'week', period: periodOf('week', today) }));
  const [page, setPage] = useState(0);

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

  return { level: view.level, period: view.period, page, setPage, chooseLevel, move, goToToday };
}

export type ViewNavigation = ReturnType<typeof useViewNavigation>;
