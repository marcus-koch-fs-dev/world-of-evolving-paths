import { useState } from 'react';
import { Icon } from 'world-of-evolving-paths/react';
import { embeddedUrl } from '../app-logic/device';

/**
 * The demo again, in a phone-sized frame on top of the page. The page in the frame has a real phone width, so every
 * rule for small screens applies there. Its data is its own: changes do not carry over to the page below.
 * The phone can be turned on its side.
 */
export function PhoneFrame({ onBack }: { onBack: () => void }) {
  const [landscape, setLandscape] = useState(false);
  return (
    <div className="demo-phone-backdrop">
      <div className="demo-phone-buttons">
        <button
          type="button"
          className={`demo-phone-button${landscape ? ' is-on' : ''}`}
          aria-pressed={landscape}
          aria-label="Turn the phone"
          title={landscape ? 'Turn to portrait' : 'Turn to landscape'}
          onClick={() => setLandscape((on) => !on)}
        >
          <Icon name="rotatePhone" />
        </button>
        <button
          type="button"
          className="demo-phone-button is-on"
          aria-label="Mobile, switch to desktop"
          title="Mobile (click for desktop)"
          onClick={onBack}
        >
          <Icon name="mobile" weight="fill" />
        </button>
      </div>
      <iframe
        className={`demo-phone${landscape ? ' is-landscape' : ''}`}
        title="Phone preview"
        src={embeddedUrl(window.location.pathname)}
      />
    </div>
  );
}
