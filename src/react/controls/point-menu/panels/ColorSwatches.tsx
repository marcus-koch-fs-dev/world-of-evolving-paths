type Props = {
  colors: readonly string[];
  value?: string;
  onPick: (color: string) => void;
};

/** A row of round color buttons. */
export function ColorSwatches({ colors, value, onPick }: Props) {
  return (
    <div className="pw-swatches">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={`pw-swatch${color === value ? ' is-on' : ''}`}
          style={{ background: color }}
          aria-label={`Color ${color}`}
          onClick={() => onPick(color)}
        />
      ))}
    </div>
  );
}
