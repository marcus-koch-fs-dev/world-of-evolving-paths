import { describe, expect, it } from 'vitest';
import { ACCENTS, accentFrom, DEFAULT_ACCENT, isReadyMade } from './accent';

describe('Accent color', () => {
  it('keeps a stored #rrggbb color, in lower case', () => {
    expect(accentFrom('#FF4FD8')).toBe('#ff4fd8');
  });

  it('falls back to the default for anything else', () => {
    expect(accentFrom('pink')).toBe(DEFAULT_ACCENT);
    expect(accentFrom('#fff')).toBe(DEFAULT_ACCENT);
    expect(accentFrom(undefined)).toBe(DEFAULT_ACCENT);
  });

  it('knows the ready-made colors and treats others as the own color', () => {
    expect(isReadyMade(ACCENTS[1].color.toUpperCase())).toBe(true);
    expect(isReadyMade('#123456')).toBe(false);
  });

  it('has the default as its first color', () => {
    expect(ACCENTS[0].color).toBe(DEFAULT_ACCENT);
  });
});
