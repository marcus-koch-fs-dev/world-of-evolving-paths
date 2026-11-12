import type { PointKind } from 'world-of-evolving-paths';

/** A point that is more than the weekly routine: it has its own name and a prio of 3 or more. */
export type Milestone = { title: string; prio: number; kind?: PointKind };

/** A branch that forks off from the point of one week. Its points follow in the weeks after it. */
export type Fork = { id: string; afterWeek: number; titles: string[]; prios: number[] };

export type Topic = {
  id: string;
  name: string;
  color: string;
  lane: number;
  /** The weekday offset (0 = Monday) so the paths do not all have their points on the same day. */
  weekday: number;
  /** Names for the weekly routine points, used one after the other. */
  weekly: string[];
  /** Milestones by week number, counted from the first week of the demo. */
  milestones: Record<number, Milestone>;
  forks?: Fork[];
  /** Check-ins per week, from the first week until yesterday. */
  perWeek: number;
};

/** How many weeks the demo covers. About half a year, with the last weeks still ahead. */
export const WEEKS = 26;
export const WEEKS_BEFORE_TODAY = 18;

// Four everyday topics with one point per week. A normal week has prio 1, every second week prio 2, every fourth
// prio 3. Milestones have 4 or 5. So the week view shows everything, the month view the fourth weeks and the
// milestones, and the year view only the few that matter most. Habits differ, so the paths differ in strength.
export const TOPICS: Topic[] = [
  {
    id: 'gym',
    name: 'Gym',
    color: '#ff5a4d',
    lane: 0,
    weekday: 0,
    perWeek: 5,
    weekly: ['Push day', 'Pull day', 'Leg day', 'Mobility', 'Heavy singles', 'Grip work'],
    milestones: {
      0: { title: 'Start training', prio: 5, kind: 'start' },
      7: { title: '5 pull-ups', prio: 4 },
      14: { title: '10 pull-ups', prio: 5 },
      21: { title: 'Handstand hold', prio: 4 },
      25: { title: 'Muscle-up', prio: 5, kind: 'goal' },
    },
    forks: [
      {
        id: 'planche',
        afterWeek: 21,
        titles: ['Planche lean', 'Tuck planche', 'Advanced tuck', 'Planche'],
        prios: [2, 3, 2, 5],
      },
    ],
  },
  {
    id: 'reading',
    name: 'Reading',
    color: '#3a86ff',
    lane: 1,
    weekday: 1,
    perWeek: 7,
    weekly: ['Read 50 pages', 'Chapter notes', 'Library visit', 'Book swap', 'Reading list'],
    milestones: {
      0: { title: 'Start reading', prio: 5, kind: 'start' },
      5: { title: '1 book', prio: 4 },
      11: { title: '3 books', prio: 5 },
      17: { title: '6 books', prio: 4 },
      25: { title: '10 books', prio: 5, kind: 'goal' },
    },
    forks: [{ id: 'speed', afterWeek: 11, titles: ['Skim a chapter', 'Speed drill', 'Read faster'], prios: [1, 3, 4] }],
  },
  {
    id: 'guitar',
    name: 'Guitar',
    color: '#06d6a0',
    lane: 2,
    weekday: 2,
    perWeek: 6,
    weekly: ['Chord changes', 'Strumming', 'Scales', 'Fingerpicking', 'Record a take'],
    milestones: {
      0: { title: 'Buy a guitar', prio: 5, kind: 'start' },
      3: { title: 'First chord', prio: 3 },
      8: { title: 'First song', prio: 4 },
      14: { title: '5 songs', prio: 5 },
      25: { title: 'Open mic', prio: 5, kind: 'goal' },
    },
  },
  {
    id: 'project',
    name: 'Side project',
    color: '#8338ec',
    lane: 3,
    weekday: 3,
    perWeek: 2,
    weekly: ['Triage issues', 'Fix a bug', 'Write tests', 'Speed check', 'Write docs'],
    milestones: {
      0: { title: 'First commit', prio: 5, kind: 'start' },
      9: { title: 'Alpha', prio: 4 },
      17: { title: 'Beta', prio: 5 },
      25: { title: 'Launch', prio: 5, kind: 'goal' },
    },
    forks: [
      { id: 'mobile', afterWeek: 17, titles: ['Mobile layout', 'Touch controls', 'Mobile beta'], prios: [2, 3, 3] },
    ],
  },
];
