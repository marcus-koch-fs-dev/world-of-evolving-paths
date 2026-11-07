import type { ReactNode } from 'react';
import './controlBar.css';

export type ControlBarPlacement = 'top' | 'left' | 'bottom-left' | 'bottom-right';

export type ControlBarProps = {
  /** Where the bar sits on the map. `top` is a full-width row, `left` is for side panels under it. */
  placement: ControlBarPlacement;
  children: ReactNode;
};

/** Puts controls at a fixed place on the map. Controls inside lay out in a row and wrap when there is little room. */
export function ControlBar({ placement, children }: ControlBarProps) {
  return <div className={`pw-control-bar pw-placement-${placement}`}>{children}</div>;
}
