import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DropZones } from './DropZones.js';

describe('Drop zones', () => {
  it('show all six places and light up only the one the bar would go to', () => {
    const html = renderToStaticMarkup(<DropZones target="bottom-right" />);

    expect(html.match(/pw-drop-zone /g)).toHaveLength(6);
    expect(html.match(/is-target/g)).toHaveLength(1);
    expect(html).toContain('pw-drop-bottom-right is-target');
  });
});
