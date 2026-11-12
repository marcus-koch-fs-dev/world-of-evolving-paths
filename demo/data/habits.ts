import {
  type Branch,
  createStore,
  fromDay,
  type PointStatus,
  type Store,
  type StorePoint,
  toDay,
  weekdayOf,
} from 'world-of-evolving-paths';
import type { CheckIn } from '../app-logic/types';
import { type Fork, TOPICS, type Topic, WEEKS, WEEKS_BEFORE_TODAY } from './topics';

const DAYS_PER_WEEK = 7;
// A fork starts a few days after the point it leaves from
const FORK_GAP_DAYS = 2;

/** The prio of a routine week: every fourth week 3, every second week 2, else 1. */
const routinePrio = (week: number) => (week % 4 === 0 ? 3 : week % 2 === 0 ? 2 : 1);

/** The day of the first week of the demo: the Monday `WEEKS_BEFORE_TODAY` weeks before the week of today. */
const firstMonday = (today: number) => today - weekdayOf(today) - WEEKS_BEFORE_TODAY * DAYS_PER_WEEK;

const statusOf = (day: number, today: number, isFirstAhead: boolean): PointStatus =>
  day < today ? 'done' : isFirstAhead ? 'current' : 'open';

function mainPoints(topic: Topic, start: number, today: number): StorePoint[] {
  const days = Array.from({ length: WEEKS }, (_, week) => start + week * DAYS_PER_WEEK + topic.weekday);
  const firstAhead = days.findIndex((day) => day >= today);
  return days.map((day, week) => {
    const milestone = topic.milestones[week];
    return {
      id: `${topic.id}-${week}`,
      date: fromDay(day),
      title: milestone?.title ?? topic.weekly[week % topic.weekly.length],
      kind: milestone?.kind ?? 'milestone',
      status: statusOf(day, today, week === firstAhead),
      prio: milestone?.prio ?? routinePrio(week),
    };
  });
}

function forkBranch(topic: Topic, fork: Fork, start: number, today: number): Branch {
  const first = start + (fork.afterWeek + 1) * DAYS_PER_WEEK + topic.weekday + FORK_GAP_DAYS;
  return {
    id: `${topic.id}-${fork.id}`,
    splitsAt: `${topic.id}-${fork.afterWeek}`,
    points: fork.titles.map((title, index) => {
      const day = first + index * DAYS_PER_WEEK;
      return {
        id: `${topic.id}-${fork.id}-${index}`,
        date: fromDay(day),
        title,
        kind: index === fork.titles.length - 1 ? 'goal' : 'milestone',
        status: statusOf(day, today, false),
        prio: fork.prios[index],
      };
    }),
  };
}

/**
 * One check-in on the days a habit is practised, spread evenly over each week, from the first week until yesterday,
 * so every path can still be checked in today.
 */
function checkInsFor(topic: Topic, start: number, today: number): CheckIn[] {
  const isPractised = (i: number) =>
    Math.floor(((i + 1) * topic.perWeek) / DAYS_PER_WEEK) > Math.floor((i * topic.perWeek) / DAYS_PER_WEEK);
  return Array.from({ length: Math.max(0, today - start) }, (_, i) => i)
    .filter(isPractised)
    .map((i) => ({ pathId: topic.id, date: fromDay(start + i) }));
}

/**
 * Four everyday topics over about half a year. In a real app this comes from your backend: paths with their
 * branches and points, and a separate list of check-ins. A check-in is just a day on a path. It makes the path
 * stronger but is not a point on the map. The heights are not given: the library places every point itself, and
 * keeps the heights the user sets.
 */
export function createHabits(todayIso: string): { store: Store; checkIns: CheckIn[] } {
  const today = toDay(todayIso);
  const start = firstMonday(today);
  return {
    store: createStore(
      TOPICS.map((topic) => ({
        id: topic.id,
        name: topic.name,
        color: topic.color,
        lane: topic.lane,
        branches: [
          { id: `${topic.id}-main`, points: mainPoints(topic, start, today) },
          ...(topic.forks ?? []).map((fork) => forkBranch(topic, fork, start, today)),
        ],
      })),
    ),
    checkIns: TOPICS.flatMap((topic) => checkInsFor(topic, start, today)),
  };
}
