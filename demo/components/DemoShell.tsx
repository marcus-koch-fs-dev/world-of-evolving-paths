import { useState } from 'react';
import { App } from '../App';
import { type DemoDevice, isEmbedded, otherDevice } from '../app-logic/device';
import { PhoneFrame } from './PhoneFrame';

/** The root of the demo: the app, and on request a phone-sized preview of it on top. */
export function DemoShell() {
  const embedded = isEmbedded(window.location.search);
  const [device, setDevice] = useState<DemoDevice>('desktop');
  const toggleDevice = () => setDevice(otherDevice);

  return (
    <>
      <App deviceToggle={embedded ? undefined : { device, onToggle: toggleDevice }} />
      {!embedded && device === 'mobile' && <PhoneFrame onBack={toggleDevice} />}
    </>
  );
}
