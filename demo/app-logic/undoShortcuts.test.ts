import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { undoShortcutFor } from './undoShortcuts';

// Stands in for the DOM's `Element`, so `instanceof Element` works without a browser
function FakeElement() {}

const createTarget = (insideTextField: boolean) =>
  Object.assign(Object.create(FakeElement.prototype), { closest: () => (insideTextField ? {} : null) });

const press = (key: string, extra: Record<string, boolean> = {}, insideTextField = false) =>
  ({
    key,
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    target: createTarget(insideTextField),
    ...extra,
  }) as unknown as KeyboardEvent;

describe('Undo shortcuts', () => {
  beforeEach(() => {
    vi.stubGlobal('Element', FakeElement);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when Ctrl+Z is pressed', () => {
    it('undoes, and with Shift it redoes', () => {
      expect(undoShortcutFor(press('z'))).toBe('undo');
      expect(undoShortcutFor(press('Z', { shiftKey: true }))).toBe('redo');
    });
  });

  describe('when Ctrl+Y or Cmd+Y is pressed', () => {
    it('redoes', () => {
      expect(undoShortcutFor(press('y'))).toBe('redo');
      expect(undoShortcutFor(press('y', { ctrlKey: false, metaKey: true }))).toBe('redo');
    });
  });

  describe('when no Ctrl or Cmd is held, or Alt is', () => {
    it('is no shortcut', () => {
      expect(undoShortcutFor(press('z', { ctrlKey: false }))).toBeNull();
      expect(undoShortcutFor(press('z', { altKey: true }))).toBeNull();
    });
  });

  describe('when the key is pressed in a text field', () => {
    it('is left to the field', () => {
      expect(undoShortcutFor(press('z', {}, true))).toBeNull();
    });
  });

  describe('when another key is pressed', () => {
    it('is no shortcut', () => {
      expect(undoShortcutFor(press('x'))).toBeNull();
    });
  });
});
