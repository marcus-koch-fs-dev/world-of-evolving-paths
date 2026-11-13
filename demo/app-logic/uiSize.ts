/** How big the controls are: three fixed forms. The sizes are in rem, so one number on the page scales all of them. */
export type UiSize = 'small' | 'regular' | 'large';

/**
 * Small is the tiny, clean look the controls are drawn in. Regular is a little roomier, as the controls first were.
 * Large has bigger icons and text that is easy to read.
 */
export const UI_SIZES: readonly { value: UiSize; label: string; percent: number }[] = [
  { value: 'small', label: 'Small', percent: 100 },
  { value: 'regular', label: 'Regular', percent: 115 },
  { value: 'large', label: 'Large', percent: 140 },
];

/** The size of the page font in percent for a form. */
export const scalePercent = (size: UiSize): number => UI_SIZES.find((entry) => entry.value === size)?.percent ?? 100;
