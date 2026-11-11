import { steppedYears, YEAR_SPANS } from '../app-logic/levels';

type Props = {
  years: number;
  onChange: (years: number) => void;
};

/** A small counter for how many years the year view spans: 1, 2, 5 or 10. */
export function YearsStepper({ years, onChange }: Props) {
  const first = YEAR_SPANS[0];
  const last = YEAR_SPANS[YEAR_SPANS.length - 1];
  return (
    <span className="demo-years" title="How many years the view spans (keys + and −)">
      <button
        type="button"
        className="pw-button"
        aria-label="Fewer years"
        disabled={years <= first}
        onClick={() => onChange(steppedYears(years, -1))}
      >
        −
      </button>
      <span className="demo-years-count">{years}</span>
      <button
        type="button"
        className="pw-button"
        aria-label="More years"
        disabled={years >= last}
        onClick={() => onChange(steppedYears(years, 1))}
      >
        +
      </button>
    </span>
  );
}
