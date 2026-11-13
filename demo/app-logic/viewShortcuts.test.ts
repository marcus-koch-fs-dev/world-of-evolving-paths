import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { viewAtPosition, viewShortcutFor } from './viewShortcuts';

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

  it('picks a view with the digits, counted from 1', () => {
    expect(press('1')).toEqual({ type: 'view', position: 1 });
    expect(press('4')).toEqual({ type: 'view', position: 4 });
  });

  it('does not use the letters of the levels any more, so M stays free for the map', () => {
    expect(press('w')).toBeNull();
    expect(press('m')).toBeNull();
    expect(press('y')).toBeNull();
    expect(press('a')).toBeNull();
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

  it('leaves other keys, 0 and shortcuts with Ctrl or Alt alone', () => {
    expect(press('x')).toBeNull();
    expect(press('0')).toBeNull();
    expect(press('y', { ctrlKey: true })).toBeNull();
    expect(press('2', { altKey: true })).toBeNull();
  });

  it('leaves keys in a text field to the field', () => {
    expect(press('2', {}, true)).toBeNull();
  });
});

describe('The view of a number', () => {
  it('counts the levels in the order of the bar, and the overview comes last', () => {
    expect(viewAtPosition(['week', 'month', 'year'], 1)).toBe('week');
    expect(viewAtPosition(['week', 'month', 'year'], 3)).toBe('year');
    expect(viewAtPosition(['week', 'month', 'year'], 4)).toBeNull();
  });

  it('follows the levels that are offered', () => {
    expect(viewAtPosition(['week', 'year'], 2)).toBe('year');
    expect(viewAtPosition(['week', 'year'], 3)).toBeNull();
  });

  it('has nothing beyond the overview', () => {
    expect(viewAtPosition(['week'], 3)).toBeUndefined();
  });
});
