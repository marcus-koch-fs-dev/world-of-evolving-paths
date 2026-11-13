import { ICON_DATA, type IconName } from './iconData.js';
import './icon.css';

export type IconProps = {
  name: IconName;
  /** `fill` shows the solid shape. Use it for something that is switched on. Default `regular`. */
  weight?: 'regular' | 'fill';
};

/**
 * A small icon from Phosphor Icons (MIT). It is drawn in the text color and as large as the text around it
 * (`1em`), so it grows with the font size. It is hidden from screen readers: the button around it needs a label.
 */
export function Icon({ name, weight = 'regular' }: IconProps) {
  return (
    <svg className="pw-icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      {ICON_DATA[name][weight].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
