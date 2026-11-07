import { type ChangeEvent, useState } from 'react';
import type { BackgroundImage } from '../../../map/index.js';
import { readImageFile } from './readImageFile.js';

type Props = { image: BackgroundImage | undefined; onChange: (image: BackgroundImage | undefined) => void };

const MIN_WIDTH = 100;
const MAX_WIDTH = 6000;

/** Chooses an image to put behind the paths, and lets the user size it. */
export function ImageFields({ image, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      onChange(await readImageFile(file));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem));
    }
  };

  const resize = (width: number) => {
    if (!image) return;
    const height = Math.round((image.height / image.width) * width);
    onChange({ ...image, width, height });
  };

  return (
    <>
      <label className="pw-field">
        Image
        <input type="file" accept="image/*" onChange={choose} />
      </label>
      {image && (
        <>
          <label className="pw-field">
            Width
            <input
              type="range"
              min={MIN_WIDTH}
              max={MAX_WIDTH}
              step={50}
              value={image.width}
              onChange={(event) => resize(Number(event.target.value))}
            />
          </label>
          <button type="button" className="pw-button" onClick={() => onChange(undefined)}>
            Remove image
          </button>
        </>
      )}
      {error && <p className="pw-error">{error}</p>}
    </>
  );
}
