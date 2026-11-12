import { useMemo, useState } from 'react';
import { todayLocal, VIEW_LEVELS } from 'world-of-evolving-paths';
import { BackgroundPanel, PathWorld, SidePanel, Toast } from 'world-of-evolving-paths/react';
import { rememberColor } from './app-logic/customColors';
import { minPrioOf, steppedYears } from './app-logic/levels';
import type { DemoMode } from './app-logic/menuGroups';
import { DemoLineMenu } from './components/DemoLineMenu';
import { Legend } from './components/Legend';
import { SelectedPointControls } from './components/SelectedPointControls';
import { SettingsPanel } from './components/SettingsPanel';
import { TimeBar } from './components/TimeBar';
import { TopBar } from './components/TopBar';
import { type SettingsValues, useDemoSettings } from './hooks/useDemoSettings';
import { useDemoState } from './hooks/useDemoState';
import { useDemoView } from './hooks/useDemoView';
import { useLineSelection } from './hooks/useLineSelection';
import { useMapEvents } from './hooks/useMapEvents';
import { useNotice } from './hooks/useNotice';
import { usePointMenuActions } from './hooks/usePointMenuActions';
import { useSelection } from './hooks/useSelection';
import { useUndoShortcuts } from './hooks/useUndoShortcuts';
import { useViewNavigation } from './hooks/useViewNavigation';
import { useViewShortcuts } from './hooks/useViewShortcuts';

// The distance between the grid points that points snap to when "Snap to grid" is on, in world units
const SNAP_STEP = 50;
// On a phone the time bar starts collapsed, so it leaves room for the map
const SMALL_SCREEN = window.matchMedia('(max-width: 600px)').matches;

/** The demo app: holds all data and state and wires the map and its controls to it. */
export function App() {
  const today = useMemo(() => todayLocal(), []);
  const notice = useNotice();
  const { state, dispatch, undoRedo } = useDemoState(today, notice.clear);
  const navigation = useViewNavigation(today);
  const settings = useDemoSettings();
  const { values, docks } = settings;
  const [mode, setMode] = useState<DemoMode>('edit');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [freeMove, setFreeMove] = useState(false);
  const editing = mode === 'edit';
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
        freeMove={freeMove}
        onStoreChange={(_next, { changed }) => dispatch({ type: 'setLayout', changed })}
        snap={values.snap ? SNAP_STEP : undefined}
        animate={values.animate}
        locale={values.locale}
        background={settings.background}
        orientation={values.orientation}
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
          onReroll={() => {
            if (level !== null) dispatch({ type: 'resetView', level, pointIds: [...visibleIds], arrowKeys });
          }}
          freeMove={freeMove}
          onFreeMoveToggle={() => setFreeMove((on) => !on)}
          onOrientationChange={(orientation) => settings.change({ orientation })}
          mode={mode}
          onModeChange={setMode}
          settingsOpen={settingsOpen}
          onSettingsToggle={() => setSettingsOpen((open) => !open)}
          undoRedo={editing ? undoRedo : undefined}
        />

        {editing && settingsOpen && (
          <SidePanel side={settingsSide} title="Settings" onClose={() => setSettingsOpen(false)}>
            <SettingsPanel values={values} onChange={changeSettings}>
              <BackgroundPanel value={settings.background} onChange={settings.setBackground} />
            </SettingsPanel>
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
          />
        )}
      </PathWorld>
    </div>
  );
}
