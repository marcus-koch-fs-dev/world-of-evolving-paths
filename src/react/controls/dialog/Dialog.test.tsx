import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog.js';

const render = () =>
  renderToStaticMarkup(
    <Dialog title="Settings" onClose={() => undefined}>
      <p>Content</p>
    </Dialog>,
  );

describe('Dialog', () => {
  it('is a dialog named by its title, with the content inside', () => {
    const html = render();

    expect(html).toContain('<dialog');
    expect(html).toContain('aria-labelledby');
    expect(html).toContain('>Settings</h2>');
    expect(html).toContain('<p>Content</p>');
  });

  it('has a button to close it, named after the window', () => {
    expect(render()).toContain('aria-label="Close Settings"');
  });
});
