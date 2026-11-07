import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shortcutFor } from './shortcuts.js';

class FakeElement {
  constructor(private readonly insideTextField: boolean) {}
  closest() {
    return this.insideTextField ? this : null;
  }
}

const press = (key: string, extra: Partial<KeyboardEvent> = {}, insideTextField = false) =>
  ({ key, target: new FakeElement(insideTextField), ...extra }) as unknown as KeyboardEvent;

describe('Keyboard shortcuts', () => {
  beforeEach(() => {
    vi.stubGlobal('Element', FakeElement);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps M to center and E to fit, in both cases', () => {
    expect(shortcutFor(press('m'), true)).toBe('center');
    expect(shortcutFor(press('M'), true)).toBe('center');
    expect(shortcutFor(press('e'), true)).toBe('fit');
    expect(shortcutFor(press('E'), true)).toBe('fit');
  });

  it('ignores other keys', () => {
    expect(shortcutFor(press('x'), true)).toBeNull();
  });

  it('does nothing when shortcuts are off', () => {
    expect(shortcutFor(press('m'), false)).toBeNull();
  });

  it('ignores presses with a modifier key', () => {
    expect(shortcutFor(press('m', { ctrlKey: true }), true)).toBeNull();
    expect(shortcutFor(press('m', { metaKey: true }), true)).toBeNull();
    expect(shortcutFor(press('m', { altKey: true }), true)).toBeNull();
  });

  it('ignores presses while typing in a field', () => {
    expect(shortcutFor(press('m', {}, true), true)).toBeNull();
  });
});
