/** How big the controls are. The sizes are in rem, so one number on the page scales all of them. */
export type UiSize = 'small' | 'regular' | 'large' | 'custom';

export const MIN_SCALE = 75;
export const MAX_SCALE = 150;

export const UI_SIZES: readonly { value: UiSize; label: string; percent?: number }[] = [
  { value: 'small', label: 'Small', percent: 87.5 },
  { value: 'regular', label: 'Regular', percent: 100 },
  { value: 'large', label: 'Large', percent: 125 },
  { value: 'custom', label: 'Custom' },
];

export const clampScale = (percent: number): number =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number.isFinite(percent) ? percent : 100));

/** The size of the page font in percent for a choice. `custom` uses the number the user set. */
export function scalePercent(size: UiSize, custom: number): number {
  const preset = UI_SIZES.find((entry) => entry.value === size)?.percent;
  return preset ?? clampScale(custom);
}
