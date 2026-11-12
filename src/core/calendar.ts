import {
  formatDate,
  formatDayMonth,
  fromDay,
  isIsoDate,
  isoWeekNumber,
  monthName,
  monthSpan,
  toDay,
  weekdayOf,
} from './dates.js';
import { formatMonthYearLong, formatNumericDate, weekPrefix } from './format.js';

export type ViewLevel = 'week' | 'month' | 'year';

/** First and last day (day numbers, both included) of what a view shows. */
export type Period = { level: ViewLevel; start: number; end: number; key: string; label: string };

export type CalendarOptions = {
  /** Weekday a week starts on: 0 = Monday ... 6 = Sunday. Default 0. */
  weekStart?: number;
  /** For the year level: how many years the period spans, 1 to 10. It ends with the year of the date. Default 1. */
  years?: number;
};

export const MAX_YEARS = 10;
const clampYears = (years: number | undefined) => Math.min(MAX_YEARS, Math.max(1, Math.round(years ?? 1)));

export const VIEW_LEVELS: readonly { level: ViewLevel; label: string }[] = [
  { level: 'week', label: 'Week' },
  { level: 'month', label: 'Month' },
  { level: 'year', label: 'Year' },
];

type Span = { start: number; end: number };

/** What a level knows about itself: which days it covers, how it is called, and where the next one starts. */
type LevelRule = {
  span(iso: string, options: CalendarOptions): Span;
  /** The name of a period. Without a locale it is written in English words, with one in the numeric form of that language. */
  label(span: Span, locale?: string): string;
  /** The date inside the period `count` steps away, and the options to build that period with. */
  shifted(period: Period, count: number): { iso: string; options: CalendarOptions };
};

const PERIOD_KEY = /^(week|month|year):(\d{4}-\d{2}-\d{2})(?:\+(\d+))?$/;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;

const pad = (value: number) => String(value).padStart(2, '0');
const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const yearAndMonth = (day: number) => fromDay(day).split('-').map(Number) as [number, number];

/** The first day of the month `months` away from the month of a day. */
function firstOfMonth(day: number, months: number): string {
  const [year, month] = yearAndMonth(day);
  const total = year * MONTHS_PER_YEAR + (month - 1) + months;
  return `${Math.floor(total / MONTHS_PER_YEAR)}-${pad(mod(total, MONTHS_PER_YEAR) + 1)}-01`;
}

const RULES: Record<ViewLevel, LevelRule> = {
  week: {
    span: (iso, options) => {
      const day = toDay(iso);
      const start = day - mod(weekdayOf(day) - (options.weekStart ?? 0), DAYS_PER_WEEK);
      return { start, end: start + DAYS_PER_WEEK - 1 };
    },
    label: ({ start, end }, locale) => {
      const calendarWeek = weekdayOf(start) === 0 ? `${weekPrefix(locale)} ${isoWeekNumber(start + 3)}, ` : '';
      const from = locale ? formatNumericDate(fromDay(start), locale, false) : formatDayMonth(start);
      const to = locale ? formatNumericDate(fromDay(end), locale) : formatDate(fromDay(end));
      return `${calendarWeek}${from} – ${to}`;
    },
    // A week keeps the weekday it started on
    shifted: (period, count) => ({
      iso: fromDay(period.start + DAYS_PER_WEEK * count),
      options: { weekStart: weekdayOf(period.start) },
    }),
  },
  month: {
    span: (iso) => {
      const [year, month] = iso.split('-').map(Number);
      return monthSpan(`${year}-${pad(month)}`);
    },
    label: ({ start }, locale) => {
      const [year, month] = yearAndMonth(start);
      return locale ? formatMonthYearLong(fromDay(start), locale) : `${monthName(month)} ${year}`;
    },
    shifted: (period, count) => ({ iso: firstOfMonth(period.start, count), options: {} }),
  },
  year: {
    span: (iso, options) => {
      const last = Number(iso.slice(0, 4));
      const first = last - clampYears(options.years) + 1;
      return { start: toDay(`${first}-01-01`), end: toDay(`${last}-12-31`) };
    },
    label: ({ start, end }) => {
      const [first, last] = [yearAndMonth(start)[0], yearAndMonth(end)[0]];
      return first === last ? String(first) : `${first}–${last}`;
    },
    // A period of several years moves by its whole length
    shifted: (period, count) => {
      const years = yearsOf(period);
      return { iso: firstOfMonth(period.end, MONTHS_PER_YEAR * years * count), options: { years } };
    },
  },
};

/** How many years a period of the year level spans. */
const yearsOf = ({ start, end }: Span) => yearAndMonth(end)[0] - yearAndMonth(start)[0] + 1;

function periodFromSpan(level: ViewLevel, span: Span): Period {
  const years = level === 'year' ? yearsOf(span) : 1;
  const key = `${level}:${fromDay(span.start)}${years > 1 ? `+${years}` : ''}`;
  return { level, ...span, key, label: RULES[level].label(span) };
}

/** The name of a period in the numeric form of a language, such as KW 45, 2.11. – 8.11.2026. period.label is the English one. */
export function periodLabel(period: Period, locale?: string): string {
  return RULES[period.level].label(period, locale);
}

/** The period of a level that contains the given date. */
export function periodOf(level: ViewLevel, iso: string, options: CalendarOptions = {}): Period {
  return periodFromSpan(level, RULES[level].span(iso, options));
}

/** Reads a period key such as `week:2026-11-02`. Returns null for anything else, for example a free view. */
export function periodFromKey(key: string): Period | null {
  const match = PERIOD_KEY.exec(key);
  if (!match) return null;
  const [, level, date, yearCount] = match;
  // A key with a date that does not exist (2026-02-30) is not a period
  if (!isIsoDate(date)) return null;
  // Only the year level has a length in years
  if (level !== 'year' && yearCount) return null;
  const years = clampYears(yearCount ? Number(yearCount) : 1);
  // The key holds the first day, a period of several years is built from its last year
  const iso = level === 'year' ? `${Number(date.slice(0, 4)) + years - 1}${date.slice(4)}` : date;
  return periodOf(level as ViewLevel, iso, { weekStart: weekdayOf(toDay(date)), years });
}

/** The period `count` steps away (negative: back). */
export function shiftPeriod(period: Period, count: number): Period {
  const { iso, options } = RULES[period.level].shifted(period, count);
  return periodOf(period.level, iso, options);
}
