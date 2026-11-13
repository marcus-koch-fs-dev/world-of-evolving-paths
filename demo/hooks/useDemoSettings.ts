import { type ControlValues, useControlSettings } from './useControlSettings';
import { type LookValues, useLookSettings } from './useLookSettings';
import { type MapValues, useMapSettings } from './useMapSettings';
import { useStoredState } from './useStoredState';

export type { Docks } from './useLookSettings';

/** All the settings the user can change in the settings window. */
export type SettingsValues = LookValues & ControlValues & MapValues;

/** The demo's settings: three groups (look, controls, map) put together. The groups keep their own states. */
export function useDemoSettings() {
  const look = useLookSettings();
  const controls = useControlSettings();
  const map = useMapSettings();
  // The colors the user kept in the color picker of the point menu
  const [customColors, setCustomColors] = useStoredState<string[]>('wep-demo:custom-colors', []);

  const values: SettingsValues = { ...look.values, ...controls.values, ...map.values };

  /** Applies the changed settings; each group takes its own. */
  const change = (patch: Partial<SettingsValues>) => {
    look.change(patch);
    controls.change(patch);
    map.change(patch);
  };

  return {
    values,
    change,
    zooms: map.zooms,
    rememberLayerZoom: map.rememberLayerZoom,
    background: look.background,
    setBackground: look.setBackground,
    docks: look.docks,
    setDocks: look.setDocks,
    customColors,
    setCustomColors,
  };
}
