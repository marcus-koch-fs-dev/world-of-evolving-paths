import { createContext } from 'react';
import type { DockSlot } from './controls/control-bar/dock.js';

// The zones along the edges where bars are docked, set by `<PathWorld>`: a left, a middle and a right one per edge
export type DockContainers = Partial<Record<DockSlot, HTMLElement>>;

export const DockContext = createContext<DockContainers>({});

// Where the bar a control sits in is docked, so a control can open away from the edge. Set by `<ControlBar>`.
export const BarSlotContext = createContext<DockSlot>('top-left');
