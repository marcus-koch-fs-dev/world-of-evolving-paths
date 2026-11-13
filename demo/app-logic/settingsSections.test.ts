import { describe, expect, it } from 'vitest';
import { sectionsFor, visibleSection } from './settingsSections';

describe('Sections of the settings', () => {
  it('offers the editor section only in the editor', () => {
    expect(sectionsFor(true).map((section) => section.id)).toContain('editor');
    expect(sectionsFor(false).map((section) => section.id)).not.toContain('editor');
  });

  it('shows the wanted section when it is offered', () => {
    expect(visibleSection('map', false)).toBe('map');
    expect(visibleSection('editor', true)).toBe('editor');
  });

  it('falls back to the first section when the wanted one is not offered', () => {
    expect(visibleSection('editor', false)).toBe('display');
  });
});
