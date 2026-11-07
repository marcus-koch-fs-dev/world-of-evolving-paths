import { formatNumericDate, fromDay } from '../../../core';
import './timeSlider.css';

export type TimeSliderProps = {
  /** First and last day number the slider reaches. */
  start: number;
  end: number;
  /** The day the slider is on, as a day number. */
  day: number;
  onDayChange: (day: number) => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  /** Shows a button that leaves time travel and returns to the real today. */
  onReset?: () => void;
  /** Language of the date next to the slider. Default: the browser's. */
  locale?: string;
};

/**
 * A slider through time with play and pause. Pass the day to the map as `today` and the "today" marker
 * moves along the paths. It holds no state: the app owns the day and whether it is playing.
 */
export function TimeSlider({
  start,
  end,
  day,
  onDayChange,
  playing,
  onPlayingChange,
  onReset,
  locale,
}: TimeSliderProps) {
  return (
    <div className="pw-time-slider">
      <button
        type="button"
        className={`pw-button${playing ? ' is-active' : ''}`}
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={() => onPlayingChange(!playing)}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        aria-label="Time"
        min={start}
        max={end}
        step={1}
        value={Math.min(end, Math.max(start, day))}
        onChange={(event) => onDayChange(Number(event.target.value))}
      />
      <span className="pw-time-label">{formatNumericDate(fromDay(day), locale)}</span>
      {onReset && (
        <button type="button" className="pw-button" onClick={onReset}>
          Now
        </button>
      )}
    </div>
  );
}
