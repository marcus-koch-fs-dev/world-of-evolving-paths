import type { PointKind } from '../../../../core';
import type { PointPatch } from '../types';

const KINDS: { kind: PointKind; label: string; glyph: string; hint: string }[] = [
  { kind: 'start', label: 'Start', glyph: '▲', hint: 'Beginning of a path' },
  { kind: 'milestone', label: 'Point', glyph: '●', hint: 'An ordinary step on the way' },
  { kind: 'crossroad', label: 'Fork', glyph: '◆', hint: 'Several ways lead on from here' },
  { kind: 'goal', label: 'Goal', glyph: '★', hint: 'The end of a path' },
];

type Props = {
  kind: PointKind;
  branches: boolean;
  onUpdate: (patch: PointPatch) => void;
};

export function KindPanel({ kind, branches, onUpdate }: Props) {
  return (
    <>
      <p>Function of this point</p>
      <div className="pw-kinds">
        {KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            className={`pw-kind${kind === option.kind ? ' is-on' : ''}`}
            onClick={() => onUpdate({ kind: option.kind })}
          >
            <span className="pw-glyph">{option.glyph}</span>
            <span>{option.label}</span>
            <em>{option.hint}</em>
          </button>
        ))}
      </div>
      <p>
        {branches
          ? 'Several ways already lead on from here.'
          : 'Two ways on from here make the point a fork by itself.'}
      </p>
    </>
  );
}
