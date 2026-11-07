import { fromDay, type PathInfo, toDay } from 'world-of-evolving-paths';
import type { DemoPoint } from '../app-logic/types';

const PATH_NAMES = [
  'Fishing',
  'Cooking',
  'Alchemy',
  'Taming',
  'Trading',
  'Stealth',
  'Archery',
  'Music',
  'Farming',
  'Mining',
  'Sailing',
  'Healing',
  'Scouting',
];

/** Days from today and importance of each step on a generated path. The goal comes last. */
const STEPS: { offset: number; importance: number }[] = [
  { offset: -130, importance: 3 },
  { offset: -104, importance: 2 },
  { offset: -80, importance: 2 },
  { offset: -57, importance: 4 },
  { offset: -33, importance: 2 },
  { offset: -12, importance: 2 },
  { offset: 0, importance: 3 },
  { offset: 11, importance: 2 },
  { offset: 24, importance: 4 },
  { offset: 46, importance: 5 },
];

const HUE_STEP = 47; // spreads the path colors around the color wheel
const TODAY_STEP_INDEX = 6;

/** `#rrggbb` for a hue in degrees, at a fixed saturation and lightness. */
function colorOfHue(hue: number): string {
  const saturation = 0.72;
  const lightness = 0.58;
  const amount = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = lightness - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** More paths so the pages and the day view have something to show. Every second path has a point today. */
export function createExtraPaths(todayIso: string, firstLane: number): { paths: PathInfo[]; points: DemoPoint[] } {
  const today = toDay(todayIso);
  const paths: PathInfo[] = [];
  const points: DemoPoint[] = [];

  PATH_NAMES.forEach((name, index) => {
    const pathId = `extra-${index}`;
    paths.push({ id: pathId, name, color: colorOfHue((index * HUE_STEP + 20) % 360), lane: firstLane + index });
    const hasPointToday = index % 2 === 0;
    STEPS.forEach((step, stepIndex) => {
      const isToday = stepIndex === TODAY_STEP_INDEX;
      // Paths without a point today drift a few days so their points do not all line up
      const offset = isToday && !hasPointToday ? step.offset + 3 + (index % 3) : step.offset;
      const last = stepIndex === STEPS.length - 1;
      points.push({
        id: `${pathId}-${stepIndex}`,
        pathId,
        date: fromDay(today + offset),
        title: last ? `${name} master` : `${name} ${stepIndex + 1}`,
        kind: stepIndex === 0 ? 'start' : last ? 'goal' : 'milestone',
        status: offset < 0 ? 'done' : offset === 0 || (isToday && !hasPointToday) ? 'current' : 'open',
        next: last ? [] : [`${pathId}-${stepIndex + 1}`],
        importance: step.importance,
      });
    });
  });
  return { paths, points };
}
