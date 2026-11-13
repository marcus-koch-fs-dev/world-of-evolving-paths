/** One line of the key overview: the keys, and what they do. */
export type KeyRow = { keys: readonly string[]; label: string };

/**
 * The key overview shown in the legend, from the same rules the keys follow. `viewLabels` are the views of the bar in
 * its order (the overview is added). The undo keys are only there in the editor.
 */
export function keymapFor(viewLabels: readonly string[], editing: boolean): KeyRow[] {
  const views = [...viewLabels, 'All'];
  return [
    { keys: views.map((_, index) => String(index + 1)), label: views.join(' · ') },
    { keys: ['T'], label: 'Today' },
    { keys: ['←', '→'], label: 'Previous · next period' },
    { keys: ['+', '−'], label: 'Years in the year view' },
    { keys: ['M'], label: 'Center the map' },
    { keys: ['E'], label: 'Fit everything' },
    ...(editing
      ? [
          { keys: ['Ctrl', 'Z'], label: 'Undo' },
          { keys: ['Ctrl', 'Y'], label: 'Redo' },
        ]
      : []),
  ];
}
