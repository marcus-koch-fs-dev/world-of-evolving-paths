import { describe, expect, it } from 'vitest';
import { keymapFor } from './keymap';

describe('Key overview', () => {
  it('numbers the views of the bar and adds the overview', () => {
    const [views] = keymapFor(['Week', 'Month', 'Year'], false);

    expect(views.keys).toEqual(['1', '2', '3', '4']);
    expect(views.label).toBe('Week · Month · Year · All');
  });

  it('follows the views that are offered', () => {
    const [views] = keymapFor(['Week', 'Year'], false);

    expect(views.keys).toEqual(['1', '2', '3']);
    expect(views.label).toBe('Week · Year · All');
  });

  it('has the undo keys only in the editor', () => {
    const labels = (editing: boolean) => keymapFor(['Week'], editing).map((row) => row.label);

    expect(labels(true)).toEqual(expect.arrayContaining(['Undo', 'Redo']));
    expect(labels(false)).not.toContain('Undo');
  });

  it('has M for the map and no key that the view keys also use', () => {
    const rows = keymapFor(['Week', 'Month', 'Year'], true);
    const all = rows.flatMap((row) => row.keys);

    expect(all.filter((key) => key === 'M')).toHaveLength(1);
    expect(rows.find((row) => row.keys.includes('M'))?.label).toBe('Center the map');
  });
});
