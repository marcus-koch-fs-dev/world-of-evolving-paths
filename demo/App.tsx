import { useMemo, useReducer, useState } from 'react';
import {
  type BackgroundOptions,
  fromDay,
  type PeriodMap,
  periodLabel,
  toDay,
  todayLocal,
  VIEW_LEVELS,
  type ViewLevel,
} from 'world-of-evolving-paths';
import {
  BackgroundPanel,
  ControlBar,
  PathWorld,
  PointMenu,
  TimeSlider,
  Toast,
  useTimePlayback,
  ViewBar,
  ZoomControls,
} from 'world-of-evolving-paths/react';
import { rememberColor } from './app-logic/customColors';
import { DEFAULT_LEVELS } from './app-logic/levels';
import { buildPeriodData } from './app-logic/periodData';
import { canComplete } from './app-logic/rules';
import { DEFAULT_SEED, initialState, nextPointProblem, reduce } from './app-logic/state';
import { type DemoMode, ModeToggle } from './components/ModeToggle';
import { SettingsPanel } from './components/SettingsPanel';
import { createHabits } from './data/habits';
import { useStoredState } from './hooks/useStoredState';
import { useViewNavigation } from './hooks/useViewNavigation';

const FREE_VIEW = 'free';
const NO_PINS = {};
const DEFAULT_BACKGROUND: BackgroundOptions = { pattern: 'stars', intensity: 0.5 };

/** Moving through time: the day, whether it plays, and the view it belongs to. It ends when the view changes. */
type TimeTravel = { view: string; day: number; playing: boolean };

function createInitialState(today: string) {
  const habits = createHabits(today);
  return initialState(habits.paths, habits.points, habits.checkIns);
}

export function App() {
  const today = useMemo(() => todayLocal(), []);
  const [state, dispatch] = useReducer(reduce, today, createInitialState);
  const navigation = useViewNavigation(today);
  const [mode, setMode] = useState<DemoMode>('edit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wavy, setWavy] = useState(false);
  const [pointsLocked, setPointsLocked] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [travel, setTravel] = useState<TimeTravel | null>(null);
  const [background, setBackground] = useStoredState<BackgroundOptions>('wep-demo:background', DEFAULT_BACKGROUND);
  const [customColors, setCustomColors] = useStoredState<string[]>('wep-demo:custom-colors', []);
  const [levels, setLevels] = useStoredState<ViewLevel[]>('wep-demo:levels', DEFAULT_LEVELS);
  const [locale, setLocale] = useStoredState<string>('wep-demo:locale', navigator.language || 'en-GB');
  const editing = mode === 'edit';

  const view = navigation.level === null ? FREE_VIEW : navigation.period.key;
  const tileKey = `${view}:p${navigation.page}`;
  const pins = state.pins[tileKey] ?? NO_PINS;
  // Time travel only counts in the view it was started in
  const travelDay = travel?.view === view ? travel.day : null;
  const playing = travel?.view === view && travel.playing;
  const shownToday = travelDay === null ? today : fromDay(travelDay);

  const result = useMemo(
    () =>
      buildPeriodData({
        paths: state.paths,
        points: state.points,
        checkIns: state.checkIns,
        asOf: travelDay === null ? undefined : fromDay(travelDay),
        period: navigation.level === null ? null : navigation.period,
        page: navigation.page,
        pins,
      }),
    [state.paths, state.points, state.checkIns, travelDay, navigation.level, navigation.period, navigation.page, pins],
  );
  const periods = useMemo<PeriodMap>(() => ({ [view]: result.data }), [view, result.data]);

  const range = useMemo(() => {
    if (navigation.level !== null) return { start: navigation.period.start, end: navigation.period.end };
    const days = state.points.map((point) => toDay(point.date));
    return { start: Math.min(...days), end: Math.max(...days) };
  }, [navigation.level, navigation.period, state.points]);

  useTimePlayback({
    playing,
    day: travelDay ?? toDay(today),
    end: range.end,
    onDayChange: (day) => setTravel({ view, day, playing: true }),
    onEnd: () => setTravel((current) => (current ? { ...current, playing: false } : current)),
  });

  const selected = state.points.find((point) => point.id === selectedId);
  const selectedPath = state.paths.find((path) => path.id === selected?.pathId);
  const offeredLevels = VIEW_LEVELS.filter((option) => levels.includes(option.level));

  const changeLevels = (next: ViewLevel[]) => {
    setLevels(next);
    if (navigation.level !== null && !next.includes(navigation.level)) navigation.chooseLevel(next[0]);
  };

  const addNext = (fromId: string, input: Parameters<typeof nextPointProblem>[0]) => {
    const problem = nextPointProblem(input);
    if (problem) return problem;
    dispatch({ type: 'addNext', fromId, input });
    const day = toDay(input.date);
    const outside = navigation.level !== null && (day < navigation.period.start || day > navigation.period.end);
    setNotice(outside ? `"${input.title}" was created, but its date is outside this ${navigation.level}.` : null);
    return null;
  };

  return (
    <div className="demo-stage">
      <PathWorld
        periods={periods}
        view={view}
        today={shownToday}
        seed={state.seeds[tileKey] ?? DEFAULT_SEED}
        editable={editing}
        wavy={wavy}
        pointsLocked={pointsLocked}
        animate={animate}
        locale={locale}
        background={background}
        onSelect={setSelectedId}
        onPointMove={({ positions }) => dispatch({ type: 'move', viewKey: tileKey, positions })}
        onPointAdd={({ x, y, date }) => {
          dispatch({ type: 'add', viewKey: tileKey, pathId: selected?.pathId ?? state.paths[0].id, x, y, date });
          setSelectedId(`custom-${state.nextId}`);
        }}
        onError={(errors) => console.error(errors.join('\n'))}
      >
        <ControlBar placement="top">
          <ViewBar
            compact
            levels={offeredLevels}
            level={navigation.level}
            onLevelChange={navigation.chooseLevel}
            freeLabel="Free"
            periodLabel={periodLabel(navigation.period, locale)}
            onPrevious={() => navigation.move(-1)}
            onNext={() => navigation.move(1)}
            onToday={navigation.goToToday}
            page={result.page}
            pages={navigation.level === null ? 0 : result.pages}
            onPageChange={navigation.setPage}
            onReroll={editing ? () => dispatch({ type: 'reroll', viewKey: tileKey }) : undefined}
          />
          <ZoomControls />
          {editing && (
            <button
              type="button"
              className={`pw-button${settingsOpen ? ' is-active' : ''}`}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              Settings
            </button>
          )}
          <ModeToggle mode={mode} onChange={setMode} />
        </ControlBar>

        {editing && settingsOpen && (
          <ControlBar placement="left">
            <SettingsPanel
              wavy={wavy}
              pointsLocked={pointsLocked}
              animate={animate}
              levels={levels}
              locale={locale}
              onWavyChange={setWavy}
              onPointsLockedChange={setPointsLocked}
              onAnimateChange={setAnimate}
              onLevelsChange={changeLevels}
              onLocaleChange={setLocale}
            >
              <BackgroundPanel value={background} onChange={setBackground} />
            </SettingsPanel>
          </ControlBar>
        )}

        <ControlBar placement="bottom-left">
          <TimeSlider
            start={range.start}
            end={range.end}
            day={travelDay ?? Math.min(range.end, Math.max(range.start, toDay(today)))}
            locale={locale}
            playing={playing}
            onDayChange={(day) => setTravel({ view, day, playing: false })}
            onPlayingChange={(next) =>
              setTravel({ view, day: travelDay === null ? range.start : travelDay, playing: next })
            }
            onReset={travelDay === null ? undefined : () => setTravel(null)}
          />
        </ControlBar>

        {editing && selected && selectedPath && (
          <ControlBar placement="bottom-right">
            <button
              type="button"
              className="pw-button"
              title="Count today for this path. It gets stronger the more days you check in."
              onClick={() => dispatch({ type: 'checkIn', pathId: selectedPath.id, date: today })}
            >
              Check in: {selectedPath.name}
            </button>
          </ControlBar>
        )}

        <Toast message={notice} onDismiss={() => setNotice(null)} />

        {editing && selected && selectedPath && (
          <PointMenu
            point={selected}
            path={selectedPath}
            canComplete={canComplete(state.points, selected.id)}
            customColors={customColors}
            onCustomColor={(color) => setCustomColors((colors) => rememberColor(colors, color))}
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
