import { isIsoDate, todayLocal } from '../../core/dates.js';
import { isValidLocale } from '../../core/format.js';
import type { BackgroundOptions, PathWorldOptions } from '../options.js';

export type BoundaryChecks = {
  /** The date to use as today. An invalid one is reported once and the local date is used instead. */
  todayOf(options: PathWorldOptions): string;
  /** The language for dates. One that the browser does not know is reported once and the browser's own is used. */
  localeOf(options: PathWorldOptions): string | undefined;
  /** The background with its colors checked. A color that is not `#rrggbb` is reported once and left out, so the default is used. */
  backgroundOf(options: PathWorldOptions): BackgroundOptions | undefined;
};

const COLOR = /^#[0-9a-fA-F]{6}$/;
const BACKGROUND_COLORS = ['base', 'color', 'color2'] as const;

/** Checks the options the app passes in. Every wrong value is reported once and replaced by a safe default. */
export function createBoundaryChecks(report: (errors: string[]) => void): BoundaryChecks {
  let reportedToday: string | null = null;
  let reportedLocale: string | null = null;
  const reportedColors = new Set<string>();

  return {
    backgroundOf({ background }) {
      if (!background) return background;
      const wrong = BACKGROUND_COLORS.filter((key) => background[key] !== undefined && !COLOR.test(background[key]));
      wrong
        .filter((key) => !reportedColors.has(`${key}:${background[key]}`))
        .forEach((key) => {
          reportedColors.add(`${key}:${background[key]}`);
          report([`background.${key} must look like #rrggbb, got "${background[key]}". The default is used instead.`]);
        });
      return wrong.length === 0
        ? background
        : { ...background, ...Object.fromEntries(wrong.map((key) => [key, undefined])) };
    },

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
