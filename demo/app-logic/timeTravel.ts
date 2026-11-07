/** The day playback starts from: the beginning when nothing was chosen or the slider is at the end, else where it is. */
export function playbackStartDay(day: number | null, start: number, end: number): number {
  return day === null || day >= end ? start : day;
}
