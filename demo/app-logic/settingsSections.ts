export type SettingsSection = 'display' | 'controls' | 'map' | 'background' | 'editor';

const SECTIONS: readonly { id: SettingsSection; label: string; editorOnly?: boolean }[] = [
  { id: 'display', label: 'Display' },
  { id: 'controls', label: 'Controls' },
  { id: 'map', label: 'Map' },
  { id: 'background', label: 'Background' },
  { id: 'editor', label: 'Editor', editorOnly: true },
];

/** The sections to offer. The editor section is only there in the editor. */
export const sectionsFor = (editing: boolean) => SECTIONS.filter((section) => !section.editorOnly || editing);

/** The section to show: the wanted one, or the first when it is not offered (for example the editor in map mode). */
export const visibleSection = (wanted: SettingsSection, editing: boolean): SettingsSection =>
  sectionsFor(editing).some((section) => section.id === wanted) ? wanted : 'display';
