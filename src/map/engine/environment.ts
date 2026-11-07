import type { BackgroundOptions } from '../options.js';

/** Does the user ask the system for less motion? */
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Are two background settings the same, field by field? */
export function sameBackground(a: BackgroundOptions | undefined, b: BackgroundOptions | undefined): boolean {
  if (a === b) return true;
  const left = a ?? {};
  const right = b ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]) as Set<keyof BackgroundOptions>;
  return [...keys].every((key) => left[key] === right[key]);
}
