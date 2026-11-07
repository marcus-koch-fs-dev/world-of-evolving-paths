const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const SINE_SCALE = 43758.5453;

/** Fixed pseudo-random number in [0, 1) for a name: the same name always gives the same number. */
export function pick(name: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < name.length; i++) hash = Math.imul(hash ^ name.charCodeAt(i), FNV_PRIME);
  const value = Math.sin(hash) * SINE_SCALE;
  return value - Math.floor(value);
}
