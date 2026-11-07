import { describe, expect, it } from 'vitest';
import { isValidLocale } from './format';

describe('Language tags', () => {
  describe('when checking a locale', () => {
    it.each(['de', 'en-GB', 'en-US', 'zh-Hans-CN'])('accepts %s', (locale) => {
      expect(isValidLocale(locale)).toBe(true);
    });

    it.each(['de_DE', 'xx-', '', 'not a locale'])('rejects "%s"', (locale) => {
      expect(isValidLocale(locale)).toBe(false);
    });
  });
});
