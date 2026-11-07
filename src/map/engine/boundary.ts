import { isIsoDate, todayLocal } from '../../core/dates';
import { isValidLocale } from '../../core/format';
import type { PathWorldOptions } from '../options';

export type BoundaryChecks = {
  /** The date to use as today. An invalid one is reported once and the local date is used instead. */
  todayOf(options: PathWorldOptions): string;
  /** The language for dates. One that the browser does not know is reported once and the browser's own is used. */
  localeOf(options: PathWorldOptions): string | undefined;
};

/** Checks the options the app passes in. Every wrong value is reported once and replaced by a safe default. */
export function createBoundaryChecks(report: (errors: string[]) => void): BoundaryChecks {
  let reportedToday: string | null = null;
  let reportedLocale: string | null = null;

  return {
    todayOf({ today }) {
      if (today === undefined) return todayLocal();
      if (isIsoDate(today)) return today;
      if (reportedToday !== today) {
        reportedToday = today;
        report([`today must be a valid YYYY-MM-DD date, got "${today}". The local date is used instead.`]);
      }
      return todayLocal();
    },

    localeOf({ locale }) {
      if (locale === undefined || isValidLocale(locale)) return locale;
      if (reportedLocale !== locale) {
        reportedLocale = locale;
        report([
          `locale must be a language tag such as "de" or "en-GB", got "${locale}". The browser's language is used instead.`,
        ]);
      }
      return undefined;
    },
  };
}
