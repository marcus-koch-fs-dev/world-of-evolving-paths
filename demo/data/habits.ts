import { fromDay, type PathInfo, toDay } from 'world-of-evolving-paths';
import type { CheckIn, DemoPoint } from '../app-logic/types';

type Step = {
  id: string;
  title: string;
  /** Days from today. Negative means in the past. */
  offset: number;
  kind?: DemoPoint['kind'];
  importance?: number;
  /** Extra branches besides the next step of the chain. */
  alsoLeadsTo?: string[];
};

type Habit = {
  /** Check-ins per week. */
  perWeek: number;
  /** For how many weeks up to today. */
  weeks: number;
};

type Topic = {
  path: PathInfo;
  steps: Step[];
  /** Steps that branch off and are not part of the main chain. */
  branches?: Step[];
  habit: Habit;
};

const TOPICS: Topic[] = [
  {
    path: { id: 'gym', name: 'Gym', color: '#ff5a4d', lane: 0 },
    habit: { perWeek: 6, weeks: 14 },
    steps: [
      { id: 'gym-start', title: 'Start training', offset: -84, kind: 'start', importance: 3 },
      { id: 'gym-program', title: 'Program set', offset: -70, importance: 2 },
      { id: 'gym-1', title: 'First pull-up', offset: -56, importance: 3 },
      { id: 'gym-5', title: '5 pull-ups', offset: -38, importance: 3 },
      { id: 'gym-10', title: '10 pull-ups', offset: -21, importance: 4 },
      { id: 'gym-handstand', title: 'Handstand hold', offset: -5, importance: 2, alsoLeadsTo: ['gym-planche'] },
      { id: 'gym-deload', title: 'Deload week', offset: -2, importance: 2 },
      { id: 'gym-weighted', title: 'Weighted pull-up', offset: 9, importance: 2 },
      { id: 'gym-muscle-up', title: 'Muscle-up', offset: 90, kind: 'goal', importance: 5 },
    ],
    branches: [{ id: 'gym-planche', title: 'Planche', offset: 180, kind: 'goal', importance: 5 }],
  },
  {
    path: { id: 'reading', name: 'Reading', color: '#3a86ff', lane: 1 },
    habit: { perWeek: 7, weeks: 6 },
    steps: [
      { id: 'read-start', title: 'Start reading', offset: -42, kind: 'start', importance: 3 },
      { id: 'read-100', title: 'First 100 pages', offset: -35, importance: 2 },
      { id: 'read-1', title: '1 book', offset: -21, importance: 3 },
      { id: 'read-list', title: 'Reading list', offset: -8, importance: 2 },
      { id: 'read-chapter', title: 'Finish chapter 5', offset: -3, importance: 2 },
      { id: 'read-3', title: '3 books', offset: 12, importance: 3, alsoLeadsTo: ['read-speed'] },
      { id: 'read-6', title: '6 books', offset: 60, importance: 4 },
      { id: 'read-12', title: '12 books', offset: 160, kind: 'goal', importance: 5 },
    ],
    branches: [{ id: 'read-speed', title: 'Speed reading', offset: 30, importance: 2 }],
  },
  {
    path: { id: 'cooking', name: 'Cooking', color: '#7ed957', lane: 2 },
    habit: { perWeek: 2, weeks: 12 },
    steps: [
      { id: 'cook-start', title: 'Start cooking', offset: -80, kind: 'start', importance: 3 },
      { id: 'cook-5', title: '5 recipes', offset: -56, importance: 3 },
      { id: 'cook-knife', title: 'Knife skills', offset: -30, importance: 2 },
      { id: 'cook-bread', title: 'Bread from scratch', offset: -12, importance: 3 },
      { id: 'cook-curry', title: 'Try a curry', offset: -1, importance: 2 },
      { id: 'cook-10', title: '10 recipes', offset: 7, importance: 3, alsoLeadsTo: ['cook-baking'] },
      { id: 'cook-friends', title: 'Cook for friends', offset: 75, kind: 'goal', importance: 5 },
    ],
    branches: [{ id: 'cook-baking', title: 'Baking', offset: 30, importance: 3 }],
  },
  {
    path: { id: 'warrior', name: 'Warrior', color: '#ff8a1c', lane: 3 },
    habit: { perWeek: 5, weeks: 10 },
    steps: [
      { id: 'war-sword', title: 'Sword basics', offset: -70, kind: 'start', importance: 3 },
      { id: 'war-shield', title: 'Shield wall', offset: -45, importance: 3 },
      { id: 'war-dungeon-1', title: 'Dungeon 1', offset: -25, importance: 3 },
      { id: 'war-whirlwind', title: 'Whirlwind', offset: -6, importance: 4 },
      { id: 'war-raid', title: 'Guild raid', offset: -2, importance: 2 },
      {
        id: 'war-dungeon-2',
        title: 'Dungeon 2',
        offset: 8,
        importance: 2,
        alsoLeadsTo: ['war-berserker', 'war-paladin'],
      },
      { id: 'war-warlord', title: 'Warlord', offset: 90, kind: 'goal', importance: 5 },
    ],
    branches: [
      { id: 'war-berserker', title: 'Berserker', offset: 35, importance: 4 },
      { id: 'war-paladin', title: 'Paladin', offset: 40, importance: 4 },
    ],
  },
  {
    path: { id: 'project', name: 'Side project', color: '#8338ec', lane: 4 },
    habit: { perWeek: 1, weeks: 12 },
    steps: [
      { id: 'proj-commit', title: 'First commit', offset: -70, kind: 'start', importance: 3 },
      { id: 'proj-repo', title: 'Repo set up', offset: -49, importance: 2 },
      { id: 'proj-prototype', title: 'Prototype', offset: -28, importance: 3 },
      { id: 'proj-tests', title: 'Write tests', offset: -3, importance: 2 },
      { id: 'proj-user', title: 'First user', offset: 10, importance: 4 },
      { id: 'proj-launch', title: 'Launch', offset: 70, kind: 'goal', importance: 5 },
    ],
  },
  {
    path: { id: 'guitar', name: 'Guitar', color: '#06d6a0', lane: 5 },
    habit: { perWeek: 7, weeks: 0.43 },
    steps: [
      { id: 'guitar-buy', title: 'Buy a guitar', offset: -4, kind: 'start', importance: 3 },
      { id: 'guitar-chord', title: 'First chord', offset: 1, importance: 2 },
      { id: 'guitar-three', title: 'Three chords', offset: 14, importance: 3 },
      { id: 'guitar-song', title: 'First song', offset: 40, kind: 'goal', importance: 4 },
    ],
  },
];

const DAYS_PER_WEEK = 7;

/** Turns steps into points: the past is done, the first step still ahead is current, the rest is open. */
function toPoints(pathId: string, steps: Step[], today: number, isMainChain: boolean): DemoPoint[] {
  const ordered = [...steps].sort((a, b) => a.offset - b.offset);
  const firstAhead = ordered.findIndex((step) => step.offset >= 0);
  return ordered.map((step, index) => ({
    id: step.id,
    pathId,
    date: fromDay(today + step.offset),
    title: step.title,
    kind: step.kind ?? 'milestone',
    status: step.offset < 0 ? 'done' : isMainChain && index === firstAhead ? 'current' : 'open',
    next: [...(isMainChain && index < ordered.length - 1 ? [ordered[index + 1].id] : []), ...(step.alsoLeadsTo ?? [])],
    importance: step.importance,
  }));
}

/** One check-in on the days a habit is practised, spread evenly over each week, ending today. */
function checkInsFor(pathId: string, habit: Habit, today: number): CheckIn[] {
  const days = Math.round(habit.weeks * DAYS_PER_WEEK);
  const checkIns: CheckIn[] = [];
  for (let i = 0; i < days; i++) {
    const practised =
      Math.floor(((i + 1) * habit.perWeek) / DAYS_PER_WEEK) > Math.floor((i * habit.perWeek) / DAYS_PER_WEEK);
    if (practised) checkIns.push({ pathId, date: fromDay(today - (days - 1 - i)) });
  }
  return checkIns;
}

/**
 * Six everyday topics. In a real app this comes from your backend: paths with their milestones, and a separate
 * list of check-ins. A check-in is just a day on a path. It makes the path stronger but is not a point on the map.
 */
export function createHabits(todayIso: string): { paths: PathInfo[]; points: DemoPoint[]; checkIns: CheckIn[] } {
  const today = toDay(todayIso);
  return {
    paths: TOPICS.map((topic) => topic.path),
    points: TOPICS.flatMap((topic) => [
      ...toPoints(topic.path.id, topic.steps, today, true),
      ...toPoints(topic.path.id, topic.branches ?? [], today, false),
    ]),
    checkIns: TOPICS.flatMap((topic) => checkInsFor(topic.path.id, topic.habit, today)),
  };
}
