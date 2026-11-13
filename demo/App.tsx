import { useMemo, useState } from 'react';
import { todayLocal, VIEW_LEVELS } from 'world-of-evolving-paths';
import { BackgroundPanel, PathWorld, SidePanel, Toast } from 'world-of-evolving-paths/react';
import { closesMenu } from './app-logic/controls';
import { rememberColor } from './app-logic/customColors';
import { isEmbedded, phoneOrientation } from './app-logic/device';
import { minPrioOf, steppedYears } from './app-logic/levels';
import type { DemoMode, SettingsPanelId } from './app-logic/menuGroups';
import { scalePercent } from './app-logic/uiSize';
import { DemoLineMenu } from './components/DemoLineMenu';
import { EditorSettings } from './components/EditorSettings';
import { Legend } from './components/Legend';
import { type DeviceToggle, ModeToggle } from './components/ModeToggle';
import { SelectedPointControls } from './components/SelectedPointControls';
import { TimeBar } from './components/TimeBar';
import { TopBar } from './components/TopBar';
import { ViewSettings } from './components/ViewSettings';
import { type SettingsValues, useDemoSettings } from './hooks/useDemoSettings';
import { useDemoState } from './hooks/useDemoState';
import { useDemoView } from './hooks/useDemoView';
import { useLineSelection } from './hooks/useLineSelection';
import { useMapEvents } from './hooks/useMapEvents';
import { useNotice } from './hooks/useNotice';
import { usePointMenuActions } from './hooks/usePointMenuActions';
import { useSelection } from './hooks/useSelection';
import { useUiScale } from './hooks/useUiScale';
import { useUndoShortcuts } from './hooks/useUndoShortcuts';
import { useViewNavigation } from './hooks/useViewNavigation';
import { useViewShortcuts } from './hooks/useViewShortcuts';
import { useWindowSize } from './hooks/useWindowSize';

// The distance between the grid points that points snap to when "Snap to grid" is on, in world units
const SNAP_STEP = 50;
// On a phone the time bar starts collapsed, so it leaves room for the map
const SMALL_SCREEN = window.matchMedia('(max-width: 600px)').matches;
// The phone shows the finished map: building is done on the desktop
const EMBEDDED = isEmbedded(window.location.search);
const PHONE = SMALL_SCREEN || EMBEDDED;
// A touch screen has no hover, so a menu that stays open gets in the way
const TOUCH_SCREEN = window.matchMedia('(pointer: coarse)').matches;

/** The demo app: holds all data and state and wires the map and its controls to it. */
export function App({ deviceToggle }: { deviceToggle?: DeviceToggle }) {
  const today = useMemo(() => todayLocal(), []);
  const notice = useNotice();
  const windowSize = useWindowSize();
  const { state, dispatch, undoRedo } = useDemoState(today, notice.clear);
  const navigation = useViewNavigation(today);
  const settings = useDemoSettings();
  const { values, docks } = settings;
  useUiScale(scalePercent(values.uiSize, values.uiScale));
  const [mode, setMode] = useState<DemoMode>(PHONE ? 'map' : 'edit');
  const [openPanel, setOpenPanel] = useState<SettingsPanelId | null>(null);
  // In the overview points and paths can be moved by hand, by anyone, once the lock is open
  const [locked, setLocked] = useState(true);
  const editing = mode === 'edit';
  // The editor settings belong to the editor: in map mode they are gone
  const panel = openPanel === 'editor' && !editing ? null : openPanel;
  // The settings slide in from the side the menu bar is not on
  const settingsSide = docks.main.endsWith('right') ? 'left' : 'right';
  useUndoShortcuts({ enabled: editing, undo: undoRedo.onUndo, redo: undoRedo.onRedo });

  useViewShortcuts((shortcut) => {
    if (shortcut.type === 'level') navigation.chooseLevel(shortcut.level);
    else if (shortcut.type === 'all') navigation.chooseLevel(null);
    else if (shortcut.type === 'today') navigation.goToToday();
    else if (shortcut.type === 'years') navigation.setYears(steppedYears(navigation.years, shortcut.step));
    else if (navigation.level !== null) navigation.move(shortcut.count);
  });

  const { period, level, view, tileKey, range, travel, store, pathIds, paging, visibleIds, arrowKeys } = useDemoView(
    state,
    navigation,
    today,
    values.pathsPerPage,
  );
  const lineSelection = useLineSelection(tileKey);
  const offeredLevels = VIEW_LEVELS.filter((option) => values.levels.includes(option.level));
  const selection = useSelection(state, visibleIds, today);
  const events = useMapEvents({
    store: state.store,
    infos: selection.infos,
    nextId: state.nextId,
    dispatch,
    level,
    period,
    pathIds,
    navigation,
    offeredLevels: values.levels,
    selectedId: selection.point?.id ?? null,
    select: selection.select,
  });
  const pointActions = usePointMenuActions({
    dispatch,
    notice,
    navigation,
    period,
    offeredLevels: values.levels,
    selected: selection.point,
  });

  const changeSettings = (patch: Partial<SettingsValues>) => {
    settings.change(patch);
    const { levels } = patch;
    if (levels && navigation.level !== null && !levels.includes(navigation.level)) navigation.chooseLevel(levels[0]);
  };

  return (
    <div className="demo-stage">
      <PathWorld
        store={store}
        view={view}
        pathIds={pathIds}
        today={travel.shownToday}
        editable={editing}
        wavy={values.wavy}
        pointsLocked={values.pointsLocked}
        freeMove={!locked}
        onStoreChange={(_next, { changed }) => dispatch({ type: 'setLayout', changed })}
        snap={values.snap ? SNAP_STEP : undefined}
        animate={values.animate}
        locale={values.locale}
        background={settings.background}
        // The phone preview decides by itself, whatever was chosen for the desktop
        orientation={EMBEDDED ? phoneOrientation(windowSize) : values.orientation}
        onSelect={(id) => {
          lineSelection.clear();
          selection.select(id);
        }}
        onLineSelect={(line) => {
          if (!editing) return;
          selection.select(null);
          lineSelection.select(line);
        }}
        onPointAdd={events.onPointAdd}
        onPointDoubleClick={events.onPointDoubleClick}
        onLeadDoubleClick={events.onLeadDoubleClick}
        onError={(errors) => console.error(errors.join('\n'))}
      >
        <TopBar
          dock={docks.main}
          onDockChange={(main) => settings.setDocks({ ...docks, main })}
          navigation={navigation}
          paging={paging}
          pathsPerPage={values.pathsPerPage}
          pathCount={state.store.paths.length}
          onPathsPerPageChange={(pathsPerPage) => settings.change({ pathsPerPage })}
          locale={values.locale}
          levels={offeredLevels}
          barItems={values.barItems}
          closeMenuOnSelect={closesMenu(values.menuClose, TOUCH_SCREEN)}
          locked={locked}
          onLockToggle={() => setLocked((on) => !on)}
          onReroll={() => {
            if (level !== null) dispatch({ type: 'resetView', level, pointIds: [...visibleIds], arrowKeys });
          }}
          onOrientationChange={(orientation) => settings.change({ orientation })}
          mode={mode}
          panel={panel}
          onPanelToggle={(id) => setOpenPanel((open) => (open === id ? null : id))}
          undoRedo={undoRedo}
        />

        {!PHONE && <ModeToggle mode={mode} onModeChange={setMode} deviceToggle={deviceToggle} />}

        {panel === 'view' && (
          <SidePanel side={settingsSide} title="View settings" onClose={() => setOpenPanel(null)}>
            <ViewSettings values={values} onChange={changeSettings}>
              <BackgroundPanel value={settings.background} onChange={settings.setBackground} />
            </ViewSettings>
          </SidePanel>
        )}

        {panel === 'editor' && (
          <SidePanel side={settingsSide} title="Editor settings" onClose={() => setOpenPanel(null)}>
            <EditorSettings values={values} onChange={changeSettings} />
          </SidePanel>
        )}

        <Legend dock="bottom-right" levels={offeredLevels} minImportance={minPrioOf(period)} startCollapsed />

        <TimeBar
          dock={docks.time}
          onDockChange={(time) => settings.setDocks({ ...docks, time })}
          range={range}
          travel={travel}
          locale={values.locale}
          startCollapsed={SMALL_SCREEN}
        />

        <Toast message={notice.text} action={notice.action} onDismiss={notice.clear} />

        {editing && lineSelection.line && (
          <DemoLineMenu
            line={lineSelection.line}
            onInsert={() => {
              if (lineSelection.line && events.insertIntoLine(lineSelection.line)) lineSelection.clear();
            }}
          />
        )}

        {editing && selection.point && selection.path && (
          <SelectedPointControls
            point={selection.point}
            path={selection.path}
            isFork={selection.isFork}
            checkedInToday={selection.checkedInToday}
            state={state}
            today={today}
            dispatch={dispatch}
            customColors={settings.customColors}
            onCustomColor={(color) => settings.setCustomColors((colors) => rememberColor(colors, color))}
            onNotice={notice.set}
            onChanged={pointActions.hintIfHidden}
            onAddNext={(input) => pointActions.addNext(selection.point?.id ?? '', input)}
            onDeleted={() => selection.select(null)}
            closeAfterAction={values.pointMenuCloses}
            onClose={() => selection.select(null)}
          />
        )}
      </PathWorld>
    </div>
  );
}
