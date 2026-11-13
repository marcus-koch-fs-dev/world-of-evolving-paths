import { Icon } from 'world-of-evolving-paths/react';

type Props = {
  canGoBack: boolean;
  onBack: () => void;
};

/** One button in the bar: back to the view before the last double-click into a finer view. */
export function BackButton({ canGoBack, onBack }: Props) {
  return (
    <button
      type="button"
      className="pw-button"
      aria-label="Back"
      title="Back to the view before the double-click"
      disabled={!canGoBack}
      onClick={onBack}
    >
      <Icon name="back" />
    </button>
  );
}
