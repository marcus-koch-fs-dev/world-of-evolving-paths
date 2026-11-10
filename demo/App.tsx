import { useCallback, useMemo, useReducer, useState } from 'react';
import { toDay, todayLocal, VIEW_LEVELS } from 'world-of-evolving-paths';
import { BackgroundPanel, ControlBar, PathWorld, PointMenu, SidePanel, Toast } from 'world-of-evolving-paths/react';
import { checkInMessage, hasCheckedIn } from './app-logic/checkIn';
import { rememberColor } from './app-logic/customColors';
import { canRedo, canUndo } from './app-logic/history';
import type { DemoMode } from './app-logic/menuGroups';
import { canComplete } from './app-logic/rules';
import { customPointId, DEFAULT_SEED, initialState, nextPointProblem } from './app-logic/state';
import { createStateHistory, historyReduce } from './app-logic/stateHistory';
import { SettingsPanel } from './components/SettingsPanel';
import { TimeBar } from './components/TimeBar';
import { TopBar } from './components/TopBar';
import { createHabits } from './data/habits';
import { useConnectMode } from './hooks/useConnectMode';
import { type SettingsValues, useDemoSettings } from './hooks/useDemoSettings';
import { useDemoView } from './hooks/useDemoView';
import { useUndoShortcuts } from './hooks/useUndoShortcuts';
import { useViewNavigation } from './hooks/useViewNavigation';

// On a phone the bars start collapsed, so they leave room for the map
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
  const [notice, setNotice] = useState<string | null>(null);
  // The settings slide in from the side the menu bar is not on
  const settingsSide = docks.main.endsWith('right') ? 'left' : 'right';
  const editing = mode === 'edit';
  const onUndo = useCallback(() => dispatch({ type: 'undo' }), []);
  const onRedo = useCallback(() => dispatch({ type: 'redo' }), []);
  const undoRedo = { canUndo: canUndo(history), canRedo: canRedo(history), onUndo, onRedo };
  useUndoShortcuts({ enabled: editing, undo: onUndo, redo: onRedo });

  const { period, view, tileKey, range, travel, result, periods } = useDemoView(state, navigation, today);

  // A point that is not in the current view is not selected, so its menu and check-in button do not linger
  const visibleIds = new Set(result.data.paths.flatMap((path) => path.points.map((point) => point.id)));
  const selected = state.points.find((point) => point.id === selectedId && visibleIds.has(point.id));
  const selectedPath = state.paths.find((path) => path.id === selected?.pathId);
  const checkedInToday = selectedPath !== undefined && hasCheckedIn(state.checkIns, selectedPath.id, today);
  const offeredLevels = VIEW_LEVELS.filter((option) => values.levels.includes(option.level));

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
        animate={values.animate}
        locale={values.locale}
        background={settings.background}
        orientation={values.orientation}
        onSelect={connecting.handleSelect}
        onPointMove={({ positions }) => dispatch({ type: 'move', viewKey: tileKey, positions })}
        onPointAdd={({ x, y, date }) => {
          dispatch({ type: 'add', viewKey: tileKey, pathId: selected?.pathId ?? state.paths[0].id, x, y, date });
          setSelectedId(customPointId(state.nextId));
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
          onReroll={() => dispatch({ type: 'reroll', viewKey: tileKey })}
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

        <Toast message={notice} onDismiss={() => setNotice(null)} />

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
            onUpdate={(patch) => dispatch({ type: 'update', id: selected.id, patch })}
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
