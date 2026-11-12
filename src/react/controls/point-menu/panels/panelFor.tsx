import type { ReactNode } from 'react';
import type { PointMenuProps } from '../PointMenu.js';
import type { TileId } from '../types.js';
import { ColorPanel } from './ColorPanel.js';
import { DeletePanel } from './DeletePanel.js';
import { DetailsPanel } from './DetailsPanel.js';
import { KindPanel } from './KindPanel.js';
import { NextPointPanel } from './NextPointPanel.js';
import { startsNewBranchByDefault } from './nextPointError.js';
import { RenamePanel } from './RenamePanel.js';
import { StatusPanel } from './StatusPanel.js';

const DEFAULT_IMPORTANCE_RANGE: [number, number] = [1, 5];

/** The tiles that open a panel. */
export type PanelId = TileId;

type Context = {
  menu: PointMenuProps;
  /** Colors offered for paths. */
  colors: readonly string[];
  /** Closes the panel. */
  close: () => void;
};

const PANELS: Record<PanelId, (context: Context) => ReactNode> = {
  status: ({ menu }) => (
    <StatusPanel status={menu.point.status} canComplete={menu.canComplete ?? true} onUpdate={menu.onUpdate} />
  ),
  next: ({ menu, close }) => (
    <NextPointPanel
      defaultDate={menu.point.date}
      startsNewBranch={startsNewBranchByDefault(menu.point.kind, menu.isFork ?? false)}
      onAddNext={menu.onAddNext}
      onDone={close}
    />
  ),
  kind: ({ menu }) => <KindPanel kind={menu.point.kind} branches={menu.isFork ?? false} onUpdate={menu.onUpdate} />,
  color: ({ menu, colors }) => (
    <ColorPanel
      colors={colors}
      value={menu.path.color}
      onPick={menu.onPathColor}
      customColors={menu.customColors}
      onCustomColor={menu.onCustomColor}
    />
  ),
  rename: ({ menu, close }) => (
    <RenamePanel title={menu.point.title} onRename={(title) => menu.onUpdate({ title })} onDone={close} />
  ),
  details: ({ menu }) => (
    <DetailsPanel
      point={menu.point}
      importanceRange={menu.importanceRange ?? DEFAULT_IMPORTANCE_RANGE}
      onUpdate={menu.onUpdate}
    />
  ),
  remove: ({ menu }) => <DeletePanel onDelete={menu.onDelete} />,
};

/** The panel a tile opens. */
export function panelFor(id: PanelId, context: Context): ReactNode {
  return PANELS[id](context);
}
