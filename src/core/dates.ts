const DAY_MS = 86400000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONDAY_OFFSET = 3; // 1970-01-01 was a Thursday
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (value: number, width = 2) => String(value).padStart(width, '0');
const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

/** Day number of an ISO date (`YYYY-MM-DD`). Throws for invalid dates such as 2026-02-30. */
export function toDay(iso: string): number {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  const day = Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
  if (fromDay(day) !== iso) throw new Error(`Invalid date: ${iso}`);
  return day;
}

/** ISO date of a day number. */
export function fromDay(day: number): string {
  const date = new Date(day * DAY_MS);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** True if the text is a valid ISO date. */
export function isIsoDate(text: string): boolean {
  try {
    toDay(text);
    return true;
  } catch {
    return false;
  }
}

/** Today's date from local time. Never uses `toISOString()`, which would give UTC. */
export function todayLocal(): string {
  const now = new Date();
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Weekday of a day number, Monday = 0. */
export function weekdayOf(day: number): number {
  return mod(day + MONDAY_OFFSET, 7);
}

/** ISO week number (1 to 53) of a day number. */
export function isoWeekNumber(day: number): number {
  const thursday = day - weekdayOf(day) + 3;
  const year = Number(fromDay(thursday).slice(0, 4));
  return Math.floor((thursday - toDay(`${year}-01-01`)) / 7) + 1;
}

/** First and last day of a month (`YYYY-MM`). */
export function monthSpan(key: string): { start: number; end: number } {
  const start = toDay(`${key}-01`);
  const [year, month] = key.split('-').map(Number);
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  return { start, end: toDay(next) - 1 };
}

/** Full month name, 1 = January. */
export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

/** Display form such as `7 Nov 2026`. */
export function formatDate(iso: string): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])} ${monthName(Number(match[2])).slice(0, 3)} ${match[1]}`;
}

/** Short display form without the year, such as `7 Nov`. */
export function formatDayMonth(day: number): string {
  return formatDate(fromDay(day)).replace(/ \d{4}$/, '');
}

/** Display form with month and year, such as `Nov 2026`. Used under the points. */
export function formatMonthYear(iso: string): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  return `${monthName(Number(match[2])).slice(0, 3)} ${match[1]}`;
}
