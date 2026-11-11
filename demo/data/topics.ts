import type { PathInfo } from 'world-of-evolving-paths';
import type { DemoPoint } from '../app-logic/types';

export type Step = {
  id: string;
  title: string;
  /** Month and day in the current year, `MM-DD`. */
  at: string;
  kind?: DemoPoint['kind'];
  importance?: number;
  /** Extra branches besides the next step of the chain. */
  alsoLeadsTo?: string[];
};

export type Habit = {
  /** Check-ins per week. */
  perWeek: number;
  /** The day the habit starts, `MM-DD` in the current year. It runs until today. */
  from: string;
};

export type Topic = {
  path: PathInfo;
  steps: Step[];
  /** Steps that branch off and are not part of the main chain. */
  branches?: Step[];
  habit: Habit;
};

// Six everyday topics over one year. The year view shows the milestones (importance 3 and up), the month more,
// the week everything. Habits differ, so the paths differ in strength: from a thin path to a wide road.
export const TOPICS: Topic[] = [
  {
    path: { id: 'gym', name: 'Gym', color: '#ff5a4d', lane: 0 },
    habit: { perWeek: 5, from: '01-06' },
    steps: [
      { id: 'gym-start', title: 'Start training', at: '01-06', kind: 'start', importance: 3 },
      { id: 'gym-program', title: 'Program set', at: '01-20', importance: 2 },
      { id: 'gym-1', title: 'First pull-up', at: '02-09', importance: 3 },
      { id: 'gym-squats', title: '30 squats', at: '03-02', importance: 1 },
      { id: 'gym-5', title: '5 pull-ups', at: '03-23', importance: 3 },
      { id: 'gym-deload-1', title: 'Deload week', at: '04-14', importance: 1 },
      { id: 'gym-pushups', title: '30 push-ups', at: '05-11', importance: 2 },
      { id: 'gym-10', title: '10 pull-ups', at: '06-08', importance: 4 },
      { id: 'gym-wall', title: 'Wall handstand', at: '07-06', importance: 2 },
      { id: 'gym-weighted', title: 'Weighted pull-up', at: '08-03', importance: 2 },
      { id: 'gym-handstand', title: 'Handstand hold', at: '09-07', importance: 3, alsoLeadsTo: ['gym-planche'] },
      { id: 'gym-deload-2', title: 'Deload week', at: '10-05', importance: 1 },
      { id: 'gym-volume', title: 'Pull-up volume', at: '11-02', importance: 1 },
      { id: 'gym-dips', title: 'Weighted dips', at: '11-09', importance: 2 },
      { id: 'gym-grip', title: 'Grip work', at: '11-10', importance: 1 },
      { id: 'gym-hold30', title: 'Handstand 30 s', at: '11-13', importance: 2 },
      { id: 'gym-singles', title: 'Heavy singles', at: '11-17', importance: 1 },
      { id: 'gym-weighted-10', title: '+10 kg pull-up', at: '11-23', importance: 3 },
      { id: 'gym-muscle-up', title: 'Muscle-up', at: '12-28', kind: 'goal', importance: 5 },
    ],
    branches: [{ id: 'gym-planche', title: 'Planche', at: '12-20', kind: 'goal', importance: 4 }],
  },
  {
    path: { id: 'reading', name: 'Reading', color: '#3a86ff', lane: 1 },
    habit: { perWeek: 7, from: '01-12' },
    steps: [
      { id: 'read-start', title: 'Start reading', at: '01-12', kind: 'start', importance: 3 },
      { id: 'read-100', title: 'First 100 pages', at: '01-26', importance: 1 },
      { id: 'read-1', title: '1 book', at: '02-16', importance: 3 },
      { id: 'read-list', title: 'Reading list', at: '03-09', importance: 2 },
      { id: 'read-2', title: '2 books', at: '03-30', importance: 2 },
      { id: 'read-3', title: '3 books', at: '04-27', importance: 3, alsoLeadsTo: ['read-speed'] },
      { id: 'read-club', title: 'Book club', at: '05-25', importance: 1 },
      { id: 'read-5', title: '5 books', at: '06-22', importance: 3 },
      { id: 'read-summer', title: 'Summer list', at: '07-27', importance: 2 },
      { id: 'read-8', title: '8 books', at: '08-31', importance: 3 },
      { id: 'read-notes', title: 'Reading notes', at: '09-28', importance: 1 },
      { id: 'read-10', title: '10 books', at: '10-26', importance: 4 },
      { id: 'read-library', title: 'Library visit', at: '11-04', importance: 1 },
      { id: 'read-chapters', title: 'Chapter notes', at: '11-09', importance: 1 },
      { id: 'read-part2', title: 'Finish part 2', at: '11-12', importance: 2 },
      { id: 'read-swap', title: 'Book swap', at: '11-16', importance: 1 },
      { id: 'read-11', title: '11 books', at: '11-30', importance: 2 },
      { id: 'read-12', title: '12 books', at: '12-28', kind: 'goal', importance: 5 },
    ],
    branches: [{ id: 'read-speed', title: 'Speed reading', at: '06-01', importance: 2 }],
  },
  {
    path: { id: 'cooking', name: 'Cooking', color: '#7ed957', lane: 2 },
    habit: { perWeek: 2, from: '01-18' },
    steps: [
      { id: 'cook-start', title: 'Start cooking', at: '01-18', kind: 'start', importance: 3 },
      { id: 'cook-5', title: '5 recipes', at: '02-08', importance: 3 },
      { id: 'cook-knife', title: 'Knife skills', at: '03-01', importance: 2 },
      { id: 'cook-soup', title: 'Soup week', at: '03-29', importance: 1 },
      { id: 'cook-bread', title: 'Bread from scratch', at: '04-26', importance: 3 },
      { id: 'cook-10', title: '10 recipes', at: '05-24', importance: 2, alsoLeadsTo: ['cook-baking'] },
      { id: 'cook-bbq', title: 'Barbecue', at: '06-21', importance: 1 },
      { id: 'cook-20', title: '20 recipes', at: '07-19', importance: 3 },
      { id: 'cook-pasta', title: 'Pasta by hand', at: '08-23', importance: 2 },
      { id: 'cook-curry', title: 'Try a curry', at: '09-20', importance: 2 },
      { id: 'cook-30', title: '30 recipes', at: '10-18', importance: 3 },
      { id: 'cook-prep', title: 'Meal prep', at: '11-03', importance: 1 },
      { id: 'cook-stock', title: 'Make a stock', at: '11-10', importance: 1 },
      { id: 'cook-menu', title: 'Plan the menu', at: '11-14', importance: 2 },
      { id: 'cook-shop', title: 'Market trip', at: '11-18', importance: 1 },
      { id: 'cook-ferment', title: 'Fermenting', at: '11-22', importance: 2 },
      { id: 'cook-friends', title: 'Cook for friends', at: '12-20', kind: 'goal', importance: 5 },
    ],
    branches: [{ id: 'cook-baking', title: 'Baking', at: '06-14', importance: 3 }],
  },
  {
    path: { id: 'warrior', name: 'Warrior', color: '#ff8a1c', lane: 3 },
    habit: { perWeek: 4, from: '02-01' },
    steps: [
      { id: 'war-sword', title: 'Sword basics', at: '02-01', kind: 'start', importance: 3 },
      { id: 'war-shield', title: 'Shield wall', at: '02-22', importance: 3 },
      { id: 'war-dungeon-1', title: 'Dungeon 1', at: '03-15', importance: 3 },
      { id: 'war-guild', title: 'Join a guild', at: '04-05', importance: 1 },
      { id: 'war-whirlwind', title: 'Whirlwind', at: '04-26', importance: 4 },
      { id: 'war-dungeon-2', title: 'Dungeon 2', at: '05-24', importance: 2 },
      { id: 'war-boss', title: 'Boss rush', at: '06-14', importance: 1 },
      { id: 'war-30', title: 'Level 30', at: '07-12', importance: 2 },
      {
        id: 'war-dungeon-3',
        title: 'Dungeon 3',
        at: '08-16',
        importance: 3,
        alsoLeadsTo: ['war-berserker', 'war-paladin'],
      },
      { id: 'war-raid', title: 'Guild raid', at: '09-13', importance: 2 },
      { id: 'war-50', title: 'Level 50', at: '10-18', importance: 3 },
      { id: 'war-daily', title: 'Daily quest', at: '11-04', importance: 1 },
      { id: 'war-loot', title: 'Loot run', at: '11-09', importance: 1 },
      { id: 'war-duel', title: 'Duel streak', at: '11-13', importance: 2 },
      { id: 'war-gear', title: 'Upgrade gear', at: '11-18', importance: 1 },
      { id: 'war-arena', title: 'Arena rank 5', at: '11-15', importance: 2 },
      { id: 'war-warlord', title: 'Warlord', at: '12-13', kind: 'goal', importance: 5 },
    ],
    branches: [
      { id: 'war-berserker', title: 'Berserker', at: '09-20', importance: 4 },
      { id: 'war-paladin', title: 'Paladin', at: '09-27', importance: 4 },
    ],
  },
  {
    path: { id: 'project', name: 'Side project', color: '#8338ec', lane: 4 },
    habit: { perWeek: 2, from: '01-25' },
    steps: [
      { id: 'proj-commit', title: 'First commit', at: '01-25', kind: 'start', importance: 3 },
      { id: 'proj-repo', title: 'Repo set up', at: '02-15', importance: 2 },
      { id: 'proj-prototype', title: 'Prototype', at: '03-08', importance: 3 },
      { id: 'proj-tests', title: 'Write tests', at: '04-05', importance: 2 },
      { id: 'proj-design', title: 'Design pass', at: '05-03', importance: 1 },
      { id: 'proj-alpha', title: 'Alpha', at: '05-31', importance: 3 },
      { id: 'proj-feedback', title: 'First feedback', at: '06-28', importance: 2 },
      { id: 'proj-beta', title: 'Beta', at: '07-26', importance: 3 },
      { id: 'proj-user', title: 'First user', at: '08-30', importance: 4 },
      { id: 'proj-docs', title: 'Write docs', at: '09-27', importance: 1 },
      { id: 'proj-public', title: 'Public beta', at: '10-25', importance: 3 },
      { id: 'proj-triage', title: 'Triage issues', at: '11-03', importance: 1 },
      { id: 'proj-login', title: 'Fix login bug', at: '11-09', importance: 1 },
      { id: 'proj-perf', title: 'Speed check', at: '11-12', importance: 2 },
      { id: 'proj-notes', title: 'Release notes', at: '11-15', importance: 1 },
      { id: 'proj-backlog', title: 'Fix the backlog', at: '11-29', importance: 1 },
      { id: 'proj-launch', title: 'Launch', at: '12-20', kind: 'goal', importance: 5 },
    ],
  },
  {
    path: { id: 'guitar', name: 'Guitar', color: '#06d6a0', lane: 5 },
    habit: { perWeek: 6, from: '03-01' },
    steps: [
      { id: 'guitar-buy', title: 'Buy a guitar', at: '03-01', kind: 'start', importance: 3 },
      { id: 'guitar-chord', title: 'First chord', at: '03-08', importance: 2 },
      { id: 'guitar-three', title: 'Three chords', at: '03-29', importance: 3 },
      { id: 'guitar-song', title: 'First song', at: '04-26', importance: 3 },
      { id: 'guitar-barre', title: 'Barre chord', at: '05-24', importance: 2 },
      { id: 'guitar-picking', title: 'Fingerpicking', at: '06-21', importance: 2 },
      { id: 'guitar-family', title: 'Play for family', at: '07-19', importance: 1 },
      { id: 'guitar-5', title: '5 songs', at: '08-16', importance: 3 },
      { id: 'guitar-scales', title: 'Scales', at: '09-20', importance: 1 },
      { id: 'guitar-solo', title: 'Learn a solo', at: '10-18', importance: 3 },
      { id: 'guitar-log', title: 'Practice log', at: '11-02', importance: 1 },
      { id: 'guitar-changes', title: 'Chord changes', at: '11-10', importance: 1 },
      { id: 'guitar-strum', title: 'Strumming', at: '11-13', importance: 2 },
      { id: 'guitar-take', title: 'Record a take', at: '11-16', importance: 1 },
      { id: 'guitar-prep', title: 'Open mic prep', at: '11-22', importance: 2 },
      { id: 'guitar-mic', title: 'Open mic', at: '12-13', kind: 'goal', importance: 5 },
    ],
  },
];
