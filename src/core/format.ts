import { toDay } from './dates.js';

const DAY_MS = 86400000;
const DEFAULT_WEEK_PREFIX = 'CW';
// Short word for "calendar week" by language. Other languages use CW.
const WEEK_PREFIX: Record<string, string> = { de: 'KW' };

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    found = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    formatters.set(key, found);
  }
  return found;
}

const dateOf = (iso: string) => new Date(toDay(iso) * DAY_MS);

/**
 * A date in the numeric form of a language: `2.11.2026` in German, `11/2/2026` in US English.
 * Without a year it is short, `2.11.`, which is easier to read. Without a locale the browser's language is used.
 */
export function formatNumericDate(iso: string, locale?: string, withYear = true): string {
  return formatter(locale, { day: 'numeric', month: 'numeric', ...(withYear ? { year: 'numeric' } : {}) }).format(
    dateOf(iso),
  );
}

/** Month and year spelled out in the language, such as `November 2026`. */
export function formatMonthYearLong(iso: string, locale?: string): string {
  return formatter(locale, { month: 'long', year: 'numeric' }).format(dateOf(iso));
}

/** The date under a point: short, and with the year only when it differs from today's year. */
export function formatPointDate(iso: string, today: string, locale?: string): string {
  return formatNumericDate(iso, locale, iso.slice(0, 4) !== today.slice(0, 4));
}

/** Short word for "calendar week" in a language: `KW` for German, otherwise `CW`. */
export function weekPrefix(locale?: string): string {
  const language = (locale ?? '').split('-')[0].toLowerCase();
  return WEEK_PREFIX[language] ?? DEFAULT_WEEK_PREFIX;
}

/** Is this a language tag the browser understands, such as `de` or `en-GB`? `de_DE` and `xx-` are not. */
export function isValidLocale(locale: string): boolean {
  try {
    return Intl.getCanonicalLocales(locale).length > 0;
  } catch {
    return false;
  }
}
