/** How big the controls are: three fixed forms, each with its own measures (in rem and em, so they follow the screen). */
export type UiSize = 'small' | 'regular' | 'large';

/**
 * Small is the tiny, clean look, with symbols only. Regular is as the controls first were, with the names under the
 * symbols. Large is Regular a little bigger, with bigger icons and text that is easy to read.
 */
export const UI_SIZES: readonly { value: UiSize; label: string; className: string }[] = [
  { value: 'small', label: 'Small', className: 'pw-compact' },
  { value: 'regular', label: 'Regular', className: '' },
  { value: 'large', label: 'Large', className: 'pw-large' },
];

/** The class for the map. Regular has none, it is what the stylesheet draws. */
export const sizeClass = (size: UiSize): string =>
  UI_SIZES.find((entry) => entry.value === size)?.className ?? 'pw-compact';

/** Do the tiles of the menu show their names? Only Small shows symbols alone. */
export const showsTileLabels = (size: UiSize): boolean => size !== 'small';
