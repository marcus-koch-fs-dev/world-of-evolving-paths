import { fromDay, type PathInfo, toDay } from 'world-of-evolving-paths';
import type { CheckIn, DemoPoint } from '../app-logic/types';
import { type Habit, type Step, TOPICS } from './topics';

const DAYS_PER_WEEK = 7;

/** The day number of a `MM-DD` date in the year of today. */
const dayOf = (year: string, at: string) => toDay(`${year}-${at}`);

/** Turns steps into points: the past is done, the first step still ahead is current, the rest is open. */
function toPoints(pathId: string, steps: Step[], today: number, year: string, isMainChain: boolean): DemoPoint[] {
  const ordered = [...steps].sort((a, b) => dayOf(year, a.at) - dayOf(year, b.at));
  const firstAhead = ordered.findIndex((step) => dayOf(year, step.at) >= today);
  return ordered.map((step, index) => {
    const day = dayOf(year, step.at);
    return {
      id: step.id,
      pathId,
      date: fromDay(day),
      title: step.title,
      kind: step.kind ?? 'milestone',
      status: day < today ? 'done' : isMainChain && index === firstAhead ? 'current' : 'open',
      next: [
        ...(isMainChain && index < ordered.length - 1 ? [ordered[index + 1].id] : []),
        ...(step.alsoLeadsTo ?? []),
      ],
      importance: step.importance,
    };
  });
}

/**
 * One check-in on the days a habit is practised, spread evenly over each week, from its start until yesterday,
 * so every path can still be checked in today.
 */
function checkInsFor(pathId: string, habit: Habit, today: number, year: string): CheckIn[] {
  const start = dayOf(year, habit.from);
  const isPractised = (i: number) =>
    Math.floor(((i + 1) * habit.perWeek) / DAYS_PER_WEEK) > Math.floor((i * habit.perWeek) / DAYS_PER_WEEK);
  return Array.from({ length: Math.max(0, today - start) }, (_, i) => i)
    .filter(isPractised)
    .map((i) => ({ pathId, date: fromDay(start + i) }));
}

/**
 * Six everyday topics over the current year. In a real app this comes from your backend: paths with their
 * milestones, and a separate list of check-ins. A check-in is just a day on a path. It makes the path stronger
 * but is not a point on the map.
 */
export function createHabits(todayIso: string): { paths: PathInfo[]; points: DemoPoint[]; checkIns: CheckIn[] } {
  const today = toDay(todayIso);
  const year = todayIso.slice(0, 4);
  return {
    paths: TOPICS.map((topic) => topic.path),
    points: TOPICS.flatMap((topic) => [
      ...toPoints(topic.path.id, topic.steps, today, year, true),
      ...toPoints(topic.path.id, topic.branches ?? [], today, year, false),
    ]),
    checkIns: TOPICS.flatMap((topic) => checkInsFor(topic.path.id, topic.habit, today, year)),
  };
}
