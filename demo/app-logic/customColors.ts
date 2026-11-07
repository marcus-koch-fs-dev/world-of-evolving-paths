export const CUSTOM_COLOR_SLOTS = 6;

/** Puts a chosen color first. A color that is already there moves up, and the oldest falls out when the slots are full. */
export function rememberColor(colors: readonly string[], color: string, slots = CUSTOM_COLOR_SLOTS): string[] {
  return [color, ...colors.filter((existing) => existing !== color)].slice(0, slots);
}
