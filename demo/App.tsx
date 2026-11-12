import { useCallback, useMemo, useReducer, useState } from 'react';
import { indexPoints, type PathInfo, toDay, todayLocal, VIEW_LEVELS } from 'world-of-evolving-paths';
import {
  BackgroundPanel,
  ControlBar,
  PathWorld,
  PointMenu,
  type PointPatch,
  SidePanel,
  Toast,
} from 'world-of-evolving-paths/react';
import { checkInMessage, hasCheckedIn } from './app-logic/checkIn';
import { rememberColor } from './app-logic/customColors';
import { canRedo, canUndo } from './app-logic/history';
import { levelThatShows, minPrioOf, steppedYears } from './app-logic/levels';
import type { DemoMode } from './app-logic/menuGroups';
import { nextPointProblem } from './app-logic/pointActions';
import { canComplete } from './app-logic/rules';
import { initialState } from './app-logic/state';
import { createStateHistory, historyReduce } from './app-logic/stateHistory';
import { DemoLineMenu } from './components/DemoLineMenu';
import { Legend } from './components/Legend';
import { SettingsPanel } from './components/SettingsPanel';
import { TimeBar } from './components/TimeBar';
import { TopBar } from './components/TopBar';
import { createHabits } from './data/habits';
import { type SettingsValues, useDemoSettings } from './hooks/useDemoSettings';
import { useDemoView } from './hooks/useDemoView';
import { useLineSelection } from './hooks/useLineSelection';
import { useMapEvents } from './hooks/useMapEvents';
import { useNotice } from './hooks/useNotice';
import { useUndoShortcuts } from './hooks/useUndoShortcuts';
import { useViewNavigation } from './hooks/useViewNavigation';
import { useViewShortcuts } from './hooks/useViewShortcuts';

// On a phone the bars start collapsed, so they leave room for the map
// The distance between the grid points that points snap to when "Snap to grid" is on, in world units
const SNAP_STEP = 50;
const SMALL_SCREEN = window.matchMedia('(max-width: 600px)').matches;

function createInitialState(today: string) {
  const habits = createHabits(today);
  return initialState(habits.store, habits.checkIns);
}

/** The demo app: holds all data and state and wires the map and its controls to it. */
export function App() {
  const today = useMemo(() => todayLocal(), []);
  const [history, dispatch] = useReducer(historyReduce, today, (day) => createStateHistory(createInitialState(day)));
  const state = history.present;
  const navigation = useViewNavigation(today);
  const settings = useDemoSettings();
  const { values, docks } = settings;
  const [mode, setMode] = useState<DemoMode>('edit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [freeMove, setFreeMove] = useState(false);
  const notice = useNotice();
  const setNotice = notice.set;
  // The settings slide in from the side the menu bar is not on
  const settingsSide = docks.main.endsWith('right') ? 'left' : 'right';
  const editing = mode === 'edit';
  // A message describes the change just made, so stepping through the history closes it
  const onUndo = useCallback(() => {
    setNotice(null);
    dispatch({ type: 'undo' });
  }, [setNotice]);
  const onRedo = useCallback(() => {
    setNotice(null);
    dispatch({ type: 'redo' });
  }, [setNotice]);
  const undoRedo = { canUndo: canUndo(history), canRedo: canRedo(history), onUndo, onRedo };
  useUndoShortcuts({ enabled: editing, undo: onUndo, redo: onRedo });

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

  // A point that is not in the current view is not selected, so its menu and check-in button do not linger
  const infos = useMemo(() => indexPoints(state.store.paths), [state.store.paths]);
  const selectedInfo = selectedId !== null && visibleIds.has(selectedId) ? infos.get(selectedId) : undefined;
  const selectedStorePath = state.store.paths.find((path) => path.id === selectedInfo?.pathId);
  const selected = selectedInfo?.point;
  const selectedPath: PathInfo | undefined = selectedStorePath && {
    id: selectedStorePath.id,
    name: selectedStorePath.name,
    color: selectedStorePath.color,
    lane: selectedStorePath.lane,
  };
  const checkedInToday = selectedPath !== undefined && hasCheckedIn(state.checkIns, selectedPath.id, today);
  const minPrio = minPrioOf(period);

  const events = useMapEvents({
    store: state.store,
    nextId: state.nextId,
    dispatch,
    level,
    period,
    pathIds,
    navigation,
    offeredLevels: values.levels,
    selectedId: selected?.id ?? null,
    select: setSelectedId,
  });

  const changeSettings = (patch: Partial<SettingsValues>) => {
    settings.change(patch);
    const { levels } = patch;
    if (levels && navigation.level !== null && !levels.includes(navigation.level)) navigation.chooseLevel(levels[0]);
  };

  /** A point that was made less important may drop out of this view. Say where it shows now, and offer to go there. */
  const hintIfHidden = (patch: PointPatch) => {
    if (!selected || patch.prio === undefined) return;
    const target = levelThatShows(patch.prio, navigation.level, values.levels);
    if (!target) return;
    notice.show(`This point is hidden here. It shows from the ${target.label.toLowerCase()} view on.`, {
      label: `Go to ${target.label.toLowerCase()}`,
      onClick: () => navigation.zoomInto(target.level, selected.date),
    });
  };

  const addNext = (fromId: string, input: Parameters<typeof nextPointProblem>[0]) => {
    const problem = nextPointProblem(input);
    if (problem) return problem;
    dispatch({ type: 'addNext', fromId, input });
    const day = toDay(input.date);
    const outside = period !== null && (day < period.start || day > period.end);
    setNotice(outside ? `"${input.title}" was created, but its date is outside this ${navigation.level}.` : null);
    return null;
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
        onStoreChange={(next) => dispatch({ type: 'setLayout', heights: next.heights, free: next.free })}
        snap={values.snap ? SNAP_STEP : undefined}
        animate={values.animate}
        locale={values.locale}
        background={settings.background}
        orientation={values.orientation}
        onSelect={(id) => {
          lineSelection.clear();
          setSelectedId(id);
        }}
        onLineSelect={(line) => {
          if (!editing) return;
          setSelectedId(null);
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

        <Legend dock="bottom-right" levels={offeredLevels} minImportance={minPrio} startCollapsed />

        <TimeBar
          dock={docks.time}
          onDockChange={(time) => settings.setDocks({ ...docks, time })}
          range={range}
          travel={travel}
          locale={values.locale}
          startCollapsed={SMALL_SCREEN}
        />

        {editing && selected && selectedPath && (
          <ControlBar dock="bottom-right">
            <button
              type="button"
              className="pw-button"
              disabled={checkedInToday}
              title="Count today for this path. It gets stronger the more days you check in."
              onClick={() => {
                setNotice(checkInMessage(state.checkIns, selectedPath, today));
                dispatch({ type: 'checkIn', pathId: selectedPath.id, date: today });
              }}
            >
              {checkedInToday ? `✓ Checked in today: ${selectedPath.name}` : `Check in: ${selectedPath.name}`}
            </button>
          </ControlBar>
        )}

        <Toast message={notice.text} action={notice.action} onDismiss={notice.clear} />

        {editing && lineSelection.line && (
          <DemoLineMenu
            line={lineSelection.line}
            onInsert={() => {
              if (lineSelection.line && events.insertIntoLine(lineSelection.line)) lineSelection.clear();
            }}
          />
        )}

        {editing && selected && selectedPath && (
          <PointMenu
            point={selected}
            path={selectedPath}
            isFork={state.store.paths.some((path) => path.branches.some((branch) => branch.splitsAt === selected.id))}
            canComplete={canComplete(state.store, selected.id)}
            checkInCount={state.checkIns.filter((checkIn) => checkIn.pathId === selectedPath.id).length}
            customColors={settings.customColors}
            onCustomColor={(color) => settings.setCustomColors((colors) => rememberColor(colors, color))}
            onUpdate={(patch) => {
              dispatch({ type: 'update', id: selected.id, patch });
              hintIfHidden(patch);
            }}
            onAddNext={(input) => addNext(selected.id, input)}
            onPathColor={(color) => dispatch({ type: 'pathColor', pathId: selectedPath.id, color })}
            onDelete={() => {
              dispatch({ type: 'delete', id: selected.id });
              setSelectedId(null);
            }}
          />
        )}
      </PathWorld>
    </div>
  );
}
