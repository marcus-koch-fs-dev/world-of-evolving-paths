import { Icon } from '../../icons/Icon.js';

export type MoveLockProps = {
  /** True while points and paths cannot be moved. */
  locked: boolean;
  onToggle: () => void;
};

/**
 * A lock the user clicks to arrange the overview ("All") by hand. It shows a closed lock while things are fixed and an
 * open, solid lock while they can be moved. Pair it with `freeMove={!locked}` on the map. It holds no state.
 */
export function MoveLock({ locked, onToggle }: MoveLockProps) {
  const label = locked ? 'Unlock to move points and paths' : 'Lock points and paths';
  return (
    <button
      type="button"
      className={`pw-button${locked ? '' : ' is-active'}`}
      aria-label={label}
      aria-pressed={!locked}
      title={label}
      onClick={onToggle}
    >
      <Icon name={locked ? 'lock' : 'unlock'} weight={locked ? 'regular' : 'fill'} />
    </button>
  );
}
