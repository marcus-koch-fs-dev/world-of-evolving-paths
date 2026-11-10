import { useRef } from 'react';

type Props = {
  label?: string;
  /** A date inside the shown period. The date picker starts there. */
  date?: string;
  /** The user picked a date. Without it the label is plain text. */
  onDateChange?: (date: string) => void;
};

/** Opens the date picker of the browser. Older browsers cannot do that, they get the focus instead. */
function openPicker(input: HTMLInputElement | null) {
  if (!input) return;
  try {
    input.showPicker();
  } catch {
    input.focus();
  }
}

/** The label of the shown period. With `onDateChange` a click on it opens a date picker. */
export function PeriodLabel({ label, date, onDateChange }: Props) {
  const input = useRef<HTMLInputElement>(null);

  if (!onDateChange) return <span className="pw-view-label">{label}</span>;

  return (
    <span className="pw-date-wrap">
      <button
        type="button"
        className="pw-button pw-view-label"
        title="Pick a date"
        onClick={() => openPicker(input.current)}
      >
        {label}
      </button>
      <input
        ref={input}
        type="date"
        className="pw-date-input"
        aria-label="Date"
        tabIndex={-1}
        value={date ?? ''}
        onChange={(event) => event.target.value && onDateChange(event.target.value)}
      />
    </span>
  );
}
