import type { ReactNode } from 'react';
import type { BackgroundOptions } from 'world-of-evolving-paths';
import { BackgroundPanel, Dialog } from 'world-of-evolving-paths/react';
import { type SettingsSection, sectionsFor, visibleSection } from '../app-logic/settingsSections';
import type { SettingsValues } from '../hooks/useDemoSettings';
import { ControlsSettings } from './settings/ControlsSettings';
import { DisplaySettings } from './settings/DisplaySettings';
import { EditorSettings } from './settings/EditorSettings';
import { MapSettings } from './settings/MapSettings';

type Props = {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  /** The editor section is only offered in the editor. */
  editing: boolean;
  values: SettingsValues;
  onChange: (patch: Partial<SettingsValues>) => void;
  background: BackgroundOptions;
  onBackgroundChange: (background: BackgroundOptions) => void;
  onClose: () => void;
};

/** The settings in a window in the middle: the sections on the left (on top on a phone), the chosen one beside them. */
export function SettingsWindow(props: Props) {
  const { editing, values, onChange } = props;
  const shown = visibleSection(props.section, editing);

  const content: Record<SettingsSection, ReactNode> = {
    display: <DisplaySettings values={values} onChange={onChange} />,
    controls: <ControlsSettings values={values} onChange={onChange} editing={editing} />,
    map: <MapSettings values={values} onChange={onChange} />,
    background: <BackgroundPanel value={props.background} onChange={props.onBackgroundChange} />,
    editor: <EditorSettings values={values} onChange={onChange} />,
  };

  return (
    <Dialog title="Settings" onClose={props.onClose}>
      <div className="demo-window">
        <nav className="demo-window-nav" aria-label="Sections">
          {sectionsFor(editing).map((section) => (
            <button
              key={section.id}
              type="button"
              className={shown === section.id ? 'is-on' : undefined}
              aria-current={shown === section.id ? 'page' : undefined}
              onClick={() => props.onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="demo-window-pane demo-settings">{content[shown]}</div>
      </div>
    </Dialog>
  );
}
