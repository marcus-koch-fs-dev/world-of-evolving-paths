import { useEffect, useRef, useState } from 'react';
import type { ViewLevel } from 'world-of-evolving-paths';
import { monthChoices, weekChoices } from '../app-logic/periodChoices';

type Props = {
  /** The label of the shown period, such as `CW 46, 9 Nov – 15 Nov 2026`. */
  label: string;
  /** A date inside the shown period. */
  date: string;
  /** The year the shown period belongs to. The picker opens on it. */
  year: number;
  locale: string;
  /** The user picked a level and a date in it. */
  onPick: (level: ViewLevel, date: string) => void;
};

/** The period label as a drop-down: pick a day, a calendar week, a month, a half year or a year. */
export function PeriodPicker({ label, date, year: shownYear, locale, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(shownYear);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const pick = (level: ViewLevel, picked: string) => {
    onPick(level, picked);
    setOpen(false);
  };

  return (
    <span className="demo-period-picker" ref={root}>
      <button
        type="button"
        className="pw-button pw-view-label"
        aria-expanded={open}
        title="Jump to a day, week, month or year"
        onClick={() => {
          setYear(shownYear);
          setOpen((current) => !current);
        }}
      >
        {label} ▾
      </button>
      {open && (
        <div className="demo-period-menu" role="dialog" aria-label="Jump to">
          <label className="demo-period-row">
            <span>Date</span>
            <input
              type="date"
              value={date}
              title="Opens the week of this date"
              onChange={(event) => event.target.value && pick('week', event.target.value)}
            />
          </label>

          <div className="demo-period-row">
            <button type="button" className="pw-button" aria-label="Previous year" onClick={() => setYear(year - 1)}>
              ‹
            </button>
            <strong>{year}</strong>
            <button type="button" className="pw-button" aria-label="Next year" onClick={() => setYear(year + 1)}>
              ›
            </button>
            <button type="button" className="pw-button" onClick={() => pick('year', `${year}-01-01`)}>
              Year
            </button>
          </div>

          <div className="demo-period-months">
            {monthChoices(year, locale).map((choice) => (
              <button key={choice.date} type="button" className="pw-button" onClick={() => pick('month', choice.date)}>
                {choice.label}
              </button>
            ))}
          </div>

          <label className="demo-period-row">
            <span>Week</span>
            <select
              className="pw-select"
              value=""
              onChange={(event) => event.target.value && pick('week', event.target.value)}
            >
              <option value="">Calendar week …</option>
              {weekChoices(year).map((choice) => (
                <option key={choice.date} value={choice.date}>
                  {choice.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </span>
  );
}
