type ColorFieldProps = { label: string; value: string; onChange: (color: string) => void };

/** A labelled color input. */
export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className="pw-field">
      {label}
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

type RangeFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

/** A labelled slider for a number. */
export function RangeField({ label, value, min, max, step, onChange }: RangeFieldProps) {
  return (
    <label className="pw-field">
      {label}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
