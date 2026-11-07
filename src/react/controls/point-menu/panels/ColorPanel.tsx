import { ColorSwatches } from './ColorSwatches';

const DEFAULT_SLOT_COUNT = 6;

type Props = {
  colors: readonly string[];
  value: string;
  onPick: (color: string) => void;
  /** Colors the user chose before, newest first. The app keeps them. */
  customColors?: readonly string[];
  /** Number of slots shown for custom colors. */
  customSlots?: number;
  /** A custom color was confirmed. The app should remember it, replacing the oldest when the slots are full. */
  onCustomColor?: (color: string) => void;
};

/** Panel to choose the color of a path, with slots for the user's own colors. */
export function ColorPanel({
  colors,
  value,
  onPick,
  customColors = [],
  customSlots = DEFAULT_SLOT_COUNT,
  onCustomColor,
}: Props) {
  const emptySlots = Math.max(0, customSlots - customColors.length);

  return (
    <>
      <p>Color of the whole path. All its points and lines change with it.</p>
      <ColorSwatches colors={colors} value={value} onPick={onPick} />
      {onCustomColor && (
        <>
          <p>Your colors</p>
          <div className="pw-swatches">
            {customColors.slice(0, customSlots).map((color) => (
              <button
                key={color}
                type="button"
                className={`pw-swatch${color === value ? ' is-on' : ''}`}
                style={{ background: color }}
                aria-label={`Color ${color}`}
                onClick={() => onPick(color)}
              />
            ))}
            {Array.from({ length: emptySlots }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: empty slots have no identity
              <span key={i} className="pw-swatch is-empty" aria-hidden="true" />
            ))}
          </div>
        </>
      )}
      <label className="pw-inline">
        Custom color
        <input
          type="color"
          value={value}
          onChange={(event) => onPick(event.target.value)}
          onBlur={(event) => onCustomColor?.(event.target.value)}
        />
      </label>
    </>
  );
}
