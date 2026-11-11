import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { viewShortcutFor } from './viewShortcuts';

// Stands in for the DOM's `Element`, so `instanceof Element` works without a browser
function FakeElement() {}

const createTarget = (insideTextField: boolean) =>
  Object.assign(Object.create(FakeElement.prototype), { closest: () => (insideTextField ? {} : null) });

const press = (key: string, extra: Record<string, boolean> = {}, insideTextField = false) =>
  viewShortcutFor({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: createTarget(insideTextField),
    ...extra,
  } as unknown as KeyboardEvent);

describe('View shortcuts', () => {
  beforeEach(() => {
    vi.stubGlobal('Element', FakeElement);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('picks a level with W, M and Y', () => {
    expect(press('m')).toEqual({ type: 'level', level: 'month' });
    expect(press('Y')).toEqual({ type: 'level', level: 'year' });
  });

  it('shows everything with A', () => {
    expect(press('a')).toEqual({ type: 'all' });
  });

  it('changes the years of the year view with + and −', () => {
    expect(press('+')).toEqual({ type: 'years', step: 1 });
    expect(press('-')).toEqual({ type: 'years', step: -1 });
  });

  it('moves to the previous and next period with the arrows', () => {
    expect(press('ArrowLeft')).toEqual({ type: 'step', count: -1 });
    expect(press('ArrowRight')).toEqual({ type: 'step', count: 1 });
  });

  it('goes to today with T', () => {
    expect(press('t')).toEqual({ type: 'today' });
  });

  it('leaves other keys and shortcuts with Ctrl alone', () => {
    expect(press('x')).toBeNull();
    expect(press('y', { ctrlKey: true })).toBeNull();
  });

  it('leaves keys in a text field to the field', () => {
    expect(press('w', {}, true)).toBeNull();
  });
});
