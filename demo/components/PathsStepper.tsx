type Props = {
  /** How many paths one page shows. */
  count: number;
  /** The most that makes sense: the number of paths there are. */
  max: number;
  onChange: (count: number) => void;
};

/** A small counter for how many paths one page shows. */
export function PathsStepper({ count, max, onChange }: Props) {
  const shown = Math.min(Math.max(1, count), Math.max(1, max));
  return (
    <span className="demo-years" title="How many paths one page shows">
      <button
        type="button"
        className="pw-button"
        aria-label="Fewer paths per page"
        disabled={shown <= 1}
        onClick={() => onChange(shown - 1)}
      >
        −
      </button>
      <span className="demo-years-count">{shown}</span>
      <button
        type="button"
        className="pw-button"
        aria-label="More paths per page"
        disabled={shown >= max}
        onClick={() => onChange(shown + 1)}
      >
        +
      </button>
    </span>
  );
}
