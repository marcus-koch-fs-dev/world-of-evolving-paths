import { BACKGROUND_DEFAULTS, type BackgroundOptions } from '../../../map';
import { ColorField, RangeField } from './fields';

type Props = { value: BackgroundOptions; onChange: (patch: BackgroundOptions) => void };

/** Fill of the background: a plain color, or a gradient between two colors. */
export function FillFields({ value, onChange }: Props) {
  const gradient = value.fill === 'gradient';
  return (
    <>
      <div className="pw-segments">
        <button
          type="button"
          className={`pw-button${gradient ? '' : ' is-active'}`}
          onClick={() => onChange({ fill: 'solid' })}
        >
          Solid
        </button>
        <button
          type="button"
          className={`pw-button${gradient ? ' is-active' : ''}`}
          onClick={() => onChange({ fill: 'gradient' })}
        >
          Gradient
        </button>
      </div>
      <ColorField
        label={gradient ? 'First color' : 'Color'}
        value={value.base ?? BACKGROUND_DEFAULTS.base}
        onChange={(base) => onChange({ base })}
      />
      {gradient && (
        <>
          <ColorField
            label="Second color"
            value={value.color2 ?? BACKGROUND_DEFAULTS.color2}
            onChange={(color2) => onChange({ color2 })}
          />
          <RangeField
            label="Angle"
            value={value.angle ?? BACKGROUND_DEFAULTS.angle}
            min={0}
            max={360}
            step={5}
            onChange={(angle) => onChange({ angle })}
          />
          <RangeField
            label="Middle"
            value={value.mid ?? BACKGROUND_DEFAULTS.mid}
            min={0}
            max={100}
            step={5}
            onChange={(mid) => onChange({ mid })}
          />
        </>
      )}
    </>
  );
}
