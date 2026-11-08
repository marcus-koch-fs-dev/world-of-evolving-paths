export type BackgroundPattern = 'none' | 'hex' | 'dots' | 'stars';

export type BackgroundOptions = {
  /** Plain color (default) or a gradient from `base` to `color2`. */
  fill?: 'solid' | 'gradient';
  pattern?: BackgroundPattern;
  /** Base color `#rrggbb`. */
  base?: string;
  /** Color of the pattern. */
  color?: string;
  /** Second color of the gradient. */
  color2?: string;
  /** Direction of the gradient in degrees. */
  angle?: number;
  /** Position of the gradient's middle in percent. */
  mid?: number;
  /** Brightness of the pattern, 0 to 1. */
  intensity?: number;
  /** Size of the pattern, 0.5 to 2. */
  scale?: number;
};
