import { fromDay, periodOf } from 'world-of-evolving-paths';

const WEEKS_MAX = 53;
const DAYS_PER_WEEK = 7;
const MIDDLE_OF_WEEK = 3; // the Thursday decides which year a calendar week belongs to

export type PeriodChoice = { date: string; label: string };

/** The calendar weeks of a year, each with a date inside it. Weeks start on Monday, week 1 holds 4 January. */
export function weekChoices(year: number): PeriodChoice[] {
  const first = periodOf('week', `${year}-01-04`).start;
  return Array.from({ length: WEEKS_MAX }, (_, index) => first + index * DAYS_PER_WEEK)
    .filter((start) => fromDay(start + MIDDLE_OF_WEEK).startsWith(`${year}-`))
    .map((start, index) => ({ date: fromDay(start), label: `CW ${index + 1} · ${shortDay(start)}` }));
}

/** The twelve months of a year, with a date inside each. `locale` names them. */
export function monthChoices(year: number, locale?: string): PeriodChoice[] {
  const name = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, month) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    return { date, label: name.format(new Date(`${date}T00:00:00Z`)) };
  });
}

/** The year a period belongs to, by its first day. */
export const yearOfDay = (day: number): number => Number(fromDay(day).slice(0, 4));

function shortDay(day: number): string {
  const [, month, date] = fromDay(day).split('-');
  return `${Number(date)}.${Number(month)}.`;
}
