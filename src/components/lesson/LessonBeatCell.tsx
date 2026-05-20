import type { RefObject } from 'react';
import type { Beat, ManipulativeState } from '@/lib/lesson/types';
import { phaseLabel } from '@/lib/lesson/phaseLabel';
import { Cell } from './Cell';
import { Prose } from './Prose';
import { ManipulativeSlot } from './ManipulativeSlot';

type CellStatus = 'locked' | 'active' | 'done';

export type LessonBeatCellProps = {
  readonly beat: Beat;
  readonly index: number;
  readonly status: CellStatus;
  readonly anchorRef: RefObject<HTMLDivElement | null>;
  readonly manipState: ManipulativeState | undefined;
  readonly showUnlockBanner: boolean;
  readonly onManipChange: (s: ManipulativeState) => void;
};

export function LessonBeatCell({
  beat,
  index,
  status,
  anchorRef,
  manipState,
  showUnlockBanner,
  onManipChange,
}: LessonBeatCellProps): React.ReactElement {
  return (
    <div>
      {showUnlockBanner && (
        <div className="cell-unlock-banner" role="status">
          <span className="cell-unlock-line" />
          <span>▸ cell {String(index).padStart(2, '0')} unlocked</span>
          <span className="cell-unlock-line" />
        </div>
      )}
      <Cell
        index={index}
        phaseLabel={phaseLabel(beat.phase)}
        status={status}
        kind={beat.kindLabel}
        anchorRef={anchorRef}
      >
        <Prose text={beat.prose} />
        <div style={{ marginTop: 24 }}>
          <ManipulativeSlot
            manip={beat.manipulative}
            value={manipState}
            onChange={onManipChange}
            disabled={status === 'locked'}
          />
        </div>
      </Cell>
    </div>
  );
}
