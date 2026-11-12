const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

const MULBERRY_STEP = 0x6d2b79f5;
const UINT32_RANGE = 4294967296;

/** Seeded sequence of numbers in [0, 1): the same seed always gives the same sequence. */
export function createSequence(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + MULBERRY_STEP) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/**
 * Fixed pseudo-random number in [0, 1) for a name: the same name always gives the same number.
 * Integer math only, so every JavaScript engine gives the same result.
 */
export function pick(name: string): number {
  const hash = name.split('').reduce((sum, char) => Math.imul(sum ^ char.charCodeAt(0), FNV_PRIME), FNV_OFFSET);
  return createSequence(hash)();
}
