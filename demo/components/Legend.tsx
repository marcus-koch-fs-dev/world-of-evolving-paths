import { symbolSize, type ViewLevel } from 'world-of-evolving-paths';
import { ControlBar, type DockSlot, Icon } from 'world-of-evolving-paths/react';
import { widestLevelShowing } from '../app-logic/levels';

// From the most to the least important, so the widest period is at the top and the finest at the bottom
const IMPORTANCES = [5, 4, 3, 2, 1];
const DOT_SCALE = 0.3; // symbol size in world units to pixels

type Props = {
  dock: DockSlot;
  /** The levels the view bar offers. */
  levels: readonly { level: ViewLevel; label: string }[];
  /** The least importance the shown view needs. */
  minImportance: number;
  startCollapsed: boolean;
};

/** A small legend: how important a point is, and the widest period that still shows it. Fainter rows are hidden here. */
export function Legend({ dock, levels, minImportance, startCollapsed }: Props) {
  const offered = levels.map((option) => option.level);
  return (
    <ControlBar dock={dock} label="Legend" collapsedIcon={<Icon name="info" />} startCollapsed={startCollapsed}>
      <div className="demo-legend">
        <div className="demo-legend-title">Importance · visible from period</div>
        {IMPORTANCES.map((importance) => {
          const size = symbolSize({ kind: 'milestone', importance }) * DOT_SCALE;
          return (
            <div key={importance} className={`demo-legend-row${importance >= minImportance ? ' is-shown' : ''}`}>
              <span className="demo-legend-dot" style={{ width: size, height: size }} />
              <span className="demo-legend-number">{importance}</span>
              <span className="demo-legend-level">{widestLevelShowing(importance, offered)?.label ?? '–'}</span>
            </div>
          );
        })}
      </div>
    </ControlBar>
  );
}
