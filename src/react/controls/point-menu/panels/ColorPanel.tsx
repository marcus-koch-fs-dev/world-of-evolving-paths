import { ColorSwatches } from './ColorSwatches';

type Props = {
  colors: readonly string[];
  value: string;
  onPick: (color: string) => void;
};

export function ColorPanel({ colors, value, onPick }: Props) {
  return (
    <>
      <p>Color of the whole path. All its points and lines change with it.</p>
      <ColorSwatches colors={colors} value={value} onPick={onPick} />
      <label className="pw-inline">
        Custom color
        <input type="color" value={value} onChange={(event) => onPick(event.target.value)} />
      </label>
    </>
  );
}
