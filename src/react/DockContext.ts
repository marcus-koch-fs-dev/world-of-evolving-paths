import { createContext } from 'react';
import type { DockEdge, DockSlot } from './controls/control-bar/dock.js';

// The containers along the edges where bars are docked, set by `<PathWorld>`
export type DockContainers = Partial<Record<DockEdge, HTMLElement>>;

export const DockContext = createContext<DockContainers>({});

// Where the bar a control sits in is docked, so a control can open away from the edge. Set by `<ControlBar>`.
export const BarSlotContext = createContext<DockSlot>('top-left');
