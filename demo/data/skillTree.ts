import { fromDay, type Path, type PathPoint, toDay } from 'world-of-evolving-paths';

type Step = {
  id: string;
  title: string;
  /** Days from today. Negative means in the past. */
  offset: number;
  kind?: PathPoint['kind'];
  importance?: number;
  note?: string;
  /** Extra branches besides the next step of the chain. */
  alsoLeadsTo?: string[];
};

export const SKILL_PATHS: Path[] = [
  { id: 'combat', name: 'Combat', color: '#ff3b3b', lane: 0 },
  { id: 'magic', name: 'Magic', color: '#3a86ff', lane: 1 },
  { id: 'crafting', name: 'Crafting', color: '#7ed957', lane: 2 },
  { id: 'exploration', name: 'Exploration', color: '#ff8a1c', lane: 3 },
  { id: 'guild', name: 'Guild', color: '#8338ec', lane: 4 },
];

const COMBAT: Step[] = [
  { id: 'combat-start', title: 'Pick up the sword', offset: -150, kind: 'start', importance: 3 },
  { id: 'combat-parry', title: 'Learn to parry', offset: -120, importance: 2 },
  { id: 'combat-shield', title: 'Shield wall', offset: -90, importance: 3, alsoLeadsTo: ['combat-defender'] },
  { id: 'combat-whirlwind', title: 'Whirlwind', offset: -45, importance: 4, note: 'First big combat skill.' },
  { id: 'combat-counter', title: 'Counter strike', offset: -14, importance: 2 },
  { id: 'combat-feint', title: 'Feint', offset: -4, importance: 2 },
  { id: 'combat-guard', title: 'Guard break', offset: 6, importance: 2 },
  { id: 'combat-rage', title: 'Berserker rage', offset: 12, importance: 4 },
  { id: 'combat-riposte', title: 'Riposte chain', offset: 26, importance: 2 },
  { id: 'combat-master', title: 'Blade master', offset: 48, kind: 'goal', importance: 5 },
];

const COMBAT_BRANCH: Step[] = [{ id: 'combat-defender', title: 'Defender stance', offset: -60, importance: 2 }];

const MAGIC: Step[] = [
  { id: 'magic-start', title: 'First spark', offset: -140, kind: 'start', importance: 3 },
  { id: 'magic-frost', title: 'Frost bolt', offset: -100, importance: 2 },
  { id: 'magic-flow', title: 'Mana flow', offset: -50, importance: 4 },
  { id: 'magic-ward', title: 'Ward spell', offset: -20, importance: 2 },
  { id: 'magic-chant', title: 'Chanting', offset: -5, importance: 2 },
  { id: 'magic-rune', title: 'Rune circle', offset: 8, importance: 2 },
  { id: 'magic-meteor', title: 'Meteor', offset: 18, importance: 4 },
  { id: 'magic-focus', title: 'Focus training', offset: 30, importance: 2 },
  { id: 'magic-archmage', title: 'Archmage', offset: 50, kind: 'goal', importance: 5 },
];

const CRAFTING: Step[] = [
  { id: 'craft-start', title: 'Light the forge', offset: -110, kind: 'start', importance: 3 },
  { id: 'craft-iron', title: 'Iron gear', offset: -70, importance: 2 },
  { id: 'craft-smelt', title: 'Smelting', offset: -32, importance: 2 },
  { id: 'craft-enchant', title: 'Enchanting', offset: -15, importance: 4 },
  { id: 'craft-hammer', title: 'Hammer technique', offset: -3, importance: 2 },
  { id: 'craft-temper', title: 'Tempering', offset: 5, importance: 2 },
  { id: 'craft-alloy', title: 'Alloys', offset: 12, importance: 2 },
  { id: 'craft-legend', title: 'Legendary weapon', offset: 40, kind: 'goal', importance: 5 },
];

const EXPLORATION: Step[] = [
  { id: 'explore-start', title: 'Leave the village', offset: -130, kind: 'start', importance: 3 },
  { id: 'explore-forest', title: 'Map the forest', offset: -95, importance: 2 },
  { id: 'explore-pass', title: 'Mountain pass', offset: -40, importance: 4 },
  { id: 'explore-river', title: 'Cross the river', offset: -18, importance: 2 },
  { id: 'explore-camp', title: 'Base camp', offset: -6, importance: 2 },
  { id: 'explore-bridge', title: 'Rope bridge', offset: 7, importance: 2 },
  { id: 'explore-cave', title: 'Hidden cave', offset: 14, importance: 3 },
  { id: 'explore-edge', title: 'Edge of the world', offset: 46, kind: 'goal', importance: 5 },
];

const GUILD: Step[] = [
  { id: 'guild-start', title: 'Join the guild', offset: -125, kind: 'start', importance: 3 },
  { id: 'guild-raid', title: 'First raid', offset: -80, importance: 4 },
  { id: 'guild-recruit', title: 'Recruit members', offset: -30, importance: 2 },
  { id: 'guild-leader', title: 'Raid leader', offset: -10, importance: 4 },
  { id: 'guild-train', title: 'Train recruits', offset: -2, importance: 2 },
  { id: 'guild-plan', title: 'Raid plan', offset: 9, importance: 2 },
  { id: 'guild-hall', title: 'Build a hall', offset: 16, importance: 3 },
  { id: 'guild-master', title: 'Guild master', offset: 44, kind: 'goal', importance: 5 },
];

/** Small daily and weekly practice points. They make the paths stronger the more often they are walked. */
function practiceSteps(prefix: string, label: string, every: number, count: number): Step[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-practice-${i}`,
    title: `${label} ${i + 1}`,
    offset: -(count - i) * every,
    importance: 1,
  }));
}

function toPoints(pathId: string, steps: Step[], today: number, chain = true): PathPoint[] {
  const firstUpcoming = steps.findIndex((step) => step.offset >= 0);
  return steps.map((step, index) => {
    const next = chain && index < steps.length - 1 ? [steps[index + 1].id] : [];
    return {
      id: step.id,
      pathId,
      date: fromDay(today + step.offset),
      title: step.title,
      kind: step.kind ?? 'milestone',
      status: step.offset < 0 ? 'done' : index === firstUpcoming ? 'current' : 'open',
      next: [...next, ...(step.alsoLeadsTo ?? [])],
      importance: step.importance,
      note: step.note,
    };
  });
}

/** Puts extra steps into a chain at the right place by date. */
function withSteps(chain: Step[], extra: Step[]): Step[] {
  return [...chain, ...extra].sort((a, b) => a.offset - b.offset);
}

/**
 * A small game character build. In a real app this is what comes from your backend:
 * paths, and points that know which points they lead to.
 * Combat is practiced every day lately, so its path grows to a highway.
 */
export function createSkillTree(todayIso: string): { paths: Path[]; points: PathPoint[] } {
  const today = toDay(todayIso);
  const points = [
    ...toPoints('combat', withSteps(COMBAT, practiceSteps('combat', 'Sparring', 1, 22)), today),
    ...toPoints('combat', COMBAT_BRANCH, today, false),
    ...toPoints('magic', withSteps(MAGIC, practiceSteps('magic', 'Spell practice', 5, 5)), today),
    ...toPoints('crafting', CRAFTING, today),
    ...toPoints('exploration', EXPLORATION, today),
    ...toPoints('guild', GUILD, today),
  ];
  return { paths: SKILL_PATHS, points };
}
