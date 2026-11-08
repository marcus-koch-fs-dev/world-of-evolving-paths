import { ControlBar, type DockSlot, TimeSlider } from 'world-of-evolving-paths/react';
import { PLAY_SPEEDS, type TimeTravel } from '../hooks/useTimeTravel';

type Props = {
  dock: DockSlot;
  onDockChange: (dock: DockSlot) => void;
  /** The days the slider reaches. */
  range: { start: number; end: number };
  travel: TimeTravel;
  locale: string;
  /** Start collapsed, to leave room on a small screen. */
  startCollapsed: boolean;
};

/** The bar with the time slider: move the map's "today" through the days of the view, or play through them. */
export function TimeBar({ dock, onDockChange, range, travel, locale, startCollapsed }: Props) {
  return (
    <ControlBar dock={dock} onDockChange={onDockChange} label="Time" startCollapsed={startCollapsed}>
      <TimeSlider
        start={range.start}
        end={range.end}
        day={travel.sliderDay}
        locale={locale}
        playing={travel.playing}
        speed={travel.speed}
        speeds={PLAY_SPEEDS}
        onSpeedChange={travel.setSpeed}
        onDayChange={travel.setDay}
        onPlayingChange={travel.setPlaying}
        onReset={travel.day === null ? undefined : travel.reset}
      />
    </ControlBar>
  );
}
