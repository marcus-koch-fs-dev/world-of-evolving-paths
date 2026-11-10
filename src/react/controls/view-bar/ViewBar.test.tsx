import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ViewBar } from './ViewBar.js';

const render = (props: Partial<Parameters<typeof ViewBar>[0]> = {}) =>
  renderToStaticMarkup(<ViewBar level="week" onLevelChange={() => undefined} periodLabel="CW 45" {...props} />);

describe('ViewBar', () => {
  describe('when no date change is wanted', () => {
    it('shows the period as plain text', () => {
      const html = render();

      expect(html).toContain('CW 45');
      expect(html).not.toContain('type="date"');
    });
  });

  describe('when the app listens to date changes', () => {
    it('shows the period as a button with a date field that starts on the given date', () => {
      const html = render({ onDateChange: () => undefined, date: '2026-11-02' });

      expect(html).toContain('title="Pick a date"');
      expect(html).toContain('type="date"');
      expect(html).toContain('value="2026-11-02"');
    });
  });

  describe('in the free view', () => {
    it('has no period, so there is nothing to pick', () => {
      const html = render({ level: null, onDateChange: () => undefined });

      expect(html).not.toContain('type="date"');
    });
  });
});
