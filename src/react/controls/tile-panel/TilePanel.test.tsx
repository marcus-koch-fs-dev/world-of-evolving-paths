import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TilePanel } from './TilePanel.js';

const groups = [
  { id: 'map', label: 'Map', tiles: [{ id: 'fit', label: 'Fit', glyph: '⤢', onClick: () => undefined }] },
];

describe('Tile panel', () => {
  it('shows only its button until it is opened', () => {
    const html = renderToStaticMarkup(<TilePanel groups={groups} />);

    expect(html).toContain('aria-label="Menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Fit');
  });

  it('names the button as asked', () => {
    expect(renderToStaticMarkup(<TilePanel groups={groups} label="Tools" glyph="+" />)).toContain('aria-label="Tools"');
  });

  it('shows a count on the button, and adds it to the name', () => {
    const html = renderToStaticMarkup(<TilePanel groups={groups} label="Check in" badge={2} />);

    expect(html).toContain('aria-label="Check in, 2"');
    expect(html).toContain('pw-tp-badge');
  });

  it('shows no count when there is nothing open', () => {
    const html = renderToStaticMarkup(<TilePanel groups={groups} label="Check in" badge={0} />);

    expect(html).toContain('aria-label="Check in"');
    expect(html).not.toContain('pw-tp-badge');
  });
});
