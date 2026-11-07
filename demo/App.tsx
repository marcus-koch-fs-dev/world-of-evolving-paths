import { useMemo, useReducer, useState } from 'react';
import { type BackgroundOptions, type PeriodMap, todayLocal } from 'world-of-evolving-paths';
import {
  BackgroundPanel,
  ControlBar,
  PathWorld,
  PointMenu,
  ViewBar,
  ZoomControls,
} from 'world-of-evolving-paths/react';
import { rememberColor } from './app-logic/customColors';
import { buildPeriodData } from './app-logic/periodData';
import { canComplete } from './app-logic/rules';
import { DEFAULT_SEED, initialState, nextPointProblem, reduce } from './app-logic/state';
import { type DemoMode, ModeToggle } from './components/ModeToggle';
import { SettingsPanel } from './components/SettingsPanel';
import { createSkillTree } from './data/skillTree';
import { useStoredState } from './hooks/useStoredState';
import { useViewNavigation } from './hooks/useViewNavigation';

const FREE_VIEW = 'free';
const NO_PINS = {};
const DEFAULT_BACKGROUND: BackgroundOptions = { pattern: 'stars', intensity: 0.5 };

function createInitialState(today: string) {
  const tree = createSkillTree(today);
  return initialState(tree.paths, tree.points);
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
  const [background, setBackground] = useStoredState<BackgroundOptions>('wep-demo:background', DEFAULT_BACKGROUND);
  const [customColors, setCustomColors] = useStoredState<string[]>('wep-demo:custom-colors', []);
  const editing = mode === 'edit';

  const view = navigation.level === null ? FREE_VIEW : navigation.period.key;
  const tileKey = `${view}:p${navigation.page}`;
  const pins = state.pins[tileKey] ?? NO_PINS;

  const result = useMemo(
    () =>
      buildPeriodData({
        paths: state.paths,
        points: state.points,
        period: navigation.level === null ? null : navigation.period,
        page: navigation.page,
        pins,
      }),
    [state.paths, state.points, navigation.level, navigation.period, navigation.page, pins],
  );
  const periods = useMemo<PeriodMap>(() => ({ [view]: result.data }), [view, result.data]);

  const selected = state.points.find((point) => point.id === selectedId);
  const selectedPath = state.paths.find((path) => path.id === selected?.pathId);

  return (
    <div className="demo-stage">
      <PathWorld
        periods={periods}
        view={view}
        today={today}
        seed={state.seeds[tileKey] ?? DEFAULT_SEED}
        editable={editing}
        wavy={wavy}
        pointsLocked={pointsLocked}
        animate={animate}
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
            level={navigation.level}
            onLevelChange={navigation.chooseLevel}
            freeLabel="Free"
            periodLabel={navigation.period.label}
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
              onWavyChange={setWavy}
              onPointsLockedChange={setPointsLocked}
              onAnimateChange={setAnimate}
            >
              <BackgroundPanel value={background} onChange={setBackground} />
            </SettingsPanel>
          </ControlBar>
        )}

        {editing && selected && selectedPath && (
          <PointMenu
            point={selected}
            path={selectedPath}
            canComplete={canComplete(state.points, selected.id)}
            customColors={customColors}
            onCustomColor={(color) => setCustomColors((colors) => rememberColor(colors, color))}
            onUpdate={(patch) => dispatch({ type: 'update', id: selected.id, patch })}
            onAddNext={(input) => {
              const problem = nextPointProblem(input);
              if (!problem) dispatch({ type: 'addNext', fromId: selected.id, input });
              return problem;
            }}
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
