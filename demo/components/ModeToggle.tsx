import { ControlBar, Icon } from 'world-of-evolving-paths/react';
import type { DemoDevice } from '../app-logic/device';
import type { DemoMode } from '../app-logic/menuGroups';

export type DeviceToggle = { device: DemoDevice; onToggle: () => void };

type Props = {
  mode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
  /** Left out inside the phone frame, which cannot open another frame. */
  deviceToggle?: DeviceToggle;
};

/**
 * Two toggles that belong to the demo, not to the library or its menu: editor or plain map, and the desktop page or a
 * phone-sized preview. Each is one button that shows the state it is in and switches to the other on a click.
 */
export function ModeToggle({ mode, onModeChange, deviceToggle }: Props) {
  const editing = mode === 'edit';
  return (
    <ControlBar dock="top-right">
      <button
        type="button"
        className="pw-button is-active"
        aria-label={editing ? 'Editor, switch to map' : 'Map, switch to editor'}
        title={editing ? 'Editor (click for the plain map)' : 'Map (click for the editor)'}
        onClick={() => onModeChange(editing ? 'map' : 'edit')}
      >
        <Icon name={editing ? 'editor' : 'map'} weight="fill" />
      </button>
      {deviceToggle && (
        <button
          type="button"
          className="pw-button is-active"
          aria-label={deviceToggle.device === 'desktop' ? 'Desktop, switch to mobile' : 'Mobile, switch to desktop'}
          title={
            deviceToggle.device === 'desktop' ? 'Desktop (click for a phone preview)' : 'Mobile (click for desktop)'
          }
          onClick={deviceToggle.onToggle}
        >
          <Icon name={deviceToggle.device === 'desktop' ? 'desktop' : 'mobile'} weight="fill" />
        </button>
      )}
    </ControlBar>
  );
}
