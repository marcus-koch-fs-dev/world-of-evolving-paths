import { useCallback, useMemo, useReducer, useState } from 'react';
import { toDay, todayLocal, VIEW_LEVELS } from 'world-of-evolving-paths';
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
import { followersOf } from './app-logic/followers';
import { heightOnPath } from './app-logic/heightOnPath';
import { canRedo, canUndo } from './app-logic/history';
import { levelThatShows, minImportanceOf, steppedYears } from './app-logic/levels';
import type { DemoMode } from './app-logic/menuGroups';
import { importanceOf } from './app-logic/periodData';
import { canComplete } from './app-logic/rules';
import { customPointId, DEFAULT_SEED, initialState, nextPointProblem } from './app-logic/state';
import { createStateHistory, historyReduce } from './app-logic/stateHistory';
import { finerLevel } from './app-logic/zoom';
import { DemoLineMenu } from './components/DemoLineMenu';
import { Legend } from './components/Legend';
import { SettingsPanel } from './components/SettingsPanel';
import { TimeBar } from './components/TimeBar';
import { TopBar } from './components/TopBar';
import { createHabits } from './data/habits';
import { useConnectMode } from './hooks/useConnectMode';
import { type SettingsValues, useDemoSettings } from './hooks/useDemoSettings';
import { useDemoView } from './hooks/useDemoView';
import { useLineSelection } from './hooks/useLineSelection';
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
  return initialState(habits.paths, habits.points, habits.checkIns);
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

  const { period, view, tileKey, range, travel, result, periods } = useDemoView(state, navigation, today);
  const lineSelection = useLineSelection(tileKey);

  // A point that is not in the current view is not selected, so its menu and check-in button do not linger
  const viewPoints = result.data.paths.flatMap((path) => path.points);
  const visibleIds = new Set(viewPoints.map((point) => point.id));
  const selected = state.points.find((point) => point.id === selectedId && visibleIds.has(point.id));
  const selectedPath = state.paths.find((path) => path.id === selected?.pathId);
  const checkedInToday = selectedPath !== undefined && hasCheckedIn(state.checkIns, selectedPath.id, today);
  const offeredLevels = VIEW_LEVELS.filter((option) => values.levels.includes(option.level));
  const minImportance = minImportanceOf(period);

  const connecting = useConnectMode({
    points: state.points,
    selectedId: selected?.id ?? null,
    connect: (fromId, toId) => dispatch({ type: 'connect', fromId, toId }),
    select: setSelectedId,
    setNotice,
  });

  const changeSettings = (patch: Partial<SettingsValues>) => {
    settings.change(patch);
    const { levels } = patch;
    if (levels && navigation.level !== null && !levels.includes(navigation.level)) navigation.chooseLevel(levels[0]);
  };

  /** A point that was made less important may drop out of this view. Say where it shows now, and offer to go there. */
  const hintIfHidden = (patch: PointPatch) => {
    if (!selected || patch.importance === undefined) return;
    const importance = importanceOf({ kind: selected.kind, importance: patch.importance });
    const target = levelThatShows(importance, navigation.level, values.levels);
    if (!target) return;
    notice.show(`This point is hidden here. It shows from the ${target.label.toLowerCase()} view on.`, {
      label: `Go to ${target.label.toLowerCase()}`,
      onClick: () => navigation.zoomInto(target.level, selected.date),
    });
  };

  /** A new point goes into the line that was clicked, where it was clicked, and its menu opens. */
  const insertIntoLine = () => {
    const { line } = lineSelection;
    if (!line?.from.id || !line.to.id) return;
    const { y, date, lanes } = line;
    // The new point joins the path of the first point of the line, at the height of the click above its lane
    const pathId = state.points.find((point) => point.id === line.from.id)?.pathId ?? '';
    const height = heightOnPath(y, lanes, pathId);
    if (height === null) return;
    dispatch({
      type: 'insert',
      fromId: line.from.id,
      toId: line.to.id,
      height,
      date,
      importance: minImportanceOf(period),
    });
    setSelectedId(customPointId(state.nextId));
    lineSelection.clear();
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
        periods={periods}
        view={view}
        today={travel.shownToday}
        seed={state.seeds[tileKey] ?? DEFAULT_SEED}
        editable={editing}
        wavy={values.wavy}
        pointsLocked={values.pointsLocked}
        snap={values.snap ? SNAP_STEP : undefined}
        animate={values.animate}
        locale={values.locale}
        background={settings.background}
        orientation={values.orientation}
        onSelect={(id) => {
          lineSelection.clear();
          connecting.handleSelect(id);
        }}
        onLineEndMove={({ from, to, y }) => {
          // The height belongs to this period: the edge of a week lies on another day than the edge of a month
          if (from.id && to.id)
            dispatch({ type: 'edgeHeight', periodKey: view, fromId: from.id, toId: to.id, height: y });
        }}
        onLineSelect={(line) => {
          // While waiting for the point to connect to, a line is not a choice
          if (!editing || connecting.from !== null) return;
          setSelectedId(null);
          lineSelection.select(line);
        }}
        onPointMove={({ id, offset, offsets }) => {
          // The points after it would follow it, so they are pinned where they are: a point moves alone
          const followers = Object.fromEntries(
            followersOf(viewPoints, id)
              .filter((followerId) => offsets[followerId] !== undefined)
              .map((followerId) => [followerId, offsets[followerId]]),
          );
          dispatch({ type: 'move', id, height: offset, followers });
        }}
        onPointAdd={({ y, date, lanes }) => {
          // The new point is as important as the view needs, so it shows where it was added
          const importance = minImportanceOf(period);
          // A path that is not on this page has no lane here, so the point goes to the selected path or the first one shown
          const pathId = selected?.pathId ?? result.data.paths[0]?.id;
          const height = pathId === undefined ? null : heightOnPath(y, lanes, pathId);
          if (pathId === undefined || height === null) return;
          dispatch({ type: 'add', pathId, height, date, importance });
          setSelectedId(customPointId(state.nextId));
        }}
        onPointDoubleClick={({ date }) => {
          // A double-click on a point goes one level finer, to the period of its date
          const level = finerLevel(navigation.level, values.levels);
          if (level) navigation.zoomInto(level, date);
        }}
        onLeadDoubleClick={({ id, date }) => {
          // A double-click on a line that leaves the view goes to the period of the point out there, in the same level
          if (navigation.level === null) return;
          navigation.zoomInto(navigation.level, date);
          if (id) setSelectedId(id);
        }}
        onError={(errors) => console.error(errors.join('\n'))}
      >
        <TopBar
          dock={docks.main}
          onDockChange={(main) => settings.setDocks({ ...docks, main })}
          navigation={navigation}
          paging={result}
          locale={values.locale}
          levels={offeredLevels}
          onReroll={() => dispatch({ type: 'reroll', viewKey: tileKey, pointIds: [...visibleIds] })}
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

        <Legend dock="bottom-right" levels={offeredLevels} minImportance={minImportance} startCollapsed />

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

        {editing && lineSelection.line && <DemoLineMenu line={lineSelection.line} onInsert={insertIntoLine} />}

        {editing && selected && selectedPath && (
          <PointMenu
            point={selected}
            path={selectedPath}
            canComplete={canComplete(state.points, selected.id)}
            connecting={connecting.from === selected.id}
            onConnect={() => connecting.toggle(selected.id)}
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
