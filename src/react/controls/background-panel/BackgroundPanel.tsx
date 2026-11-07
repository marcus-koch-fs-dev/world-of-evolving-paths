import { BACKGROUND_DEFAULTS, type BackgroundOptions } from '../../../map';
import { FillFields } from './FillFields';
import { RangeField } from './fields';
import { ImageFields } from './ImageFields';
import { PatternPicker } from './PatternPicker';
import './backgroundPanel.css';

export type BackgroundPanelProps = {
  value: BackgroundOptions;
  onChange: (next: BackgroundOptions) => void;
};

/**
 * Settings for the background: fill (plain or gradient), pattern and an image behind the paths.
 * It holds no state. Pass the options to `PathWorld` and store what `onChange` gives you.
 */
export function BackgroundPanel({ value, onChange }: BackgroundPanelProps) {
  const change = (patch: BackgroundOptions) => onChange({ ...value, ...patch });
  const hasPattern = (value.pattern ?? 'none') !== 'none';

  return (
    <section className="pw-background-panel" aria-label="Background">
      <h3>Background</h3>
      <FillFields value={value} onChange={change} />
      <PatternPicker value={value.pattern ?? 'none'} onChange={(pattern) => change({ pattern })} />
      {hasPattern && (
        <>
          <RangeField
            label="Brightness"
            value={value.intensity ?? BACKGROUND_DEFAULTS.intensity}
            min={0}
            max={1}
            step={0.05}
            onChange={(intensity) => change({ intensity })}
          />
          <RangeField
            label="Pattern size"
            value={value.scale ?? BACKGROUND_DEFAULTS.scale}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(scale) => change({ scale })}
          />
        </>
      )}
      <ImageFields image={value.image} onChange={(image) => onChange({ ...value, image })} />
    </section>
  );
}
