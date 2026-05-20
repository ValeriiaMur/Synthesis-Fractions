'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import Image from 'next/image';
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { EquivalenceConfig, EquivalenceState } from '@/lib/lesson/types';
import { coverStatusText, isCovered, placeQuarter } from '@/lib/lesson/coverLogic';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';
import { getSfxPlayer } from '@/lib/audio/sfxPlayer';
import { useSpokenFeedback } from '@/lib/lesson/useSpokenFeedback';

/** Unit-based sizing — one quarter = one UNIT_PX square, four of them
 *  side-by-side make the whole bar (matches the WholeMaterial). */
const UNIT_PX = 80;
const PILE_INITIAL = 4;
const HAMMER_PX = 56;

const HAMMER_ID = 'equivalence-hammer';
const TRAY_ID = 'equivalence-tray';

export type EquivalenceMaterialProps = {
  readonly config: EquivalenceConfig;
  readonly value: EquivalenceState | undefined;
  readonly onChange: (state: EquivalenceState) => void;
  readonly disabled?: boolean;
};

/**
 * Lesson 05 — "fill the whole, then break it."
 *
 * Tray: same width as the WholeMaterial bar (4 quarter-units, no frame).
 * The kid taps quarters from the pile; each tap drops one into the next
 * empty slot. Four placed = the whole fills (data-covered) and the beat
 * completes.
 *
 * Once filled, a square hammer appears. Drag it onto the bar → release
 * over the tray → the chocolate breaks (placedCount → 0, pile refills).
 *
 * Drag is @dnd-kit/core with the smooth single-draggable pattern: the
 * live `transform` is applied to the hammer button itself (GPU-composited
 * translate3d, so it glides under the finger) rather than a DragOverlay.
 * A `PointerSensor` with a small distance constraint (no delay) makes the
 * drag pick up immediately on the first move while a plain tap does
 * nothing; `touch-action: none` on the hammer (globals.css) stops the
 * page scrolling out from under a touch-drag. `pointerWithin` collision
 * means the drop is decided by the finger position, not the dragged box.
 * Enter/Space on the focused hammer breaks the bar too (keyboard + tests).
 */
export function EquivalenceMaterial({
  config,
  value,
  onChange,
  disabled = false,
}: EquivalenceMaterialProps) {
  const placed = value?.placedCount ?? 0;
  const target = config.targetCount;
  const covered = isCovered({ placedCount: placed }, target);
  const pileRemaining = Math.max(0, PILE_INITIAL - placed);
  const status = coverStatusText({ placedCount: placed }, target);

  const [justBroken, setJustBroken] = useState(false);
  const justBrokenTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (justBrokenTimerRef.current !== null) {
        window.clearTimeout(justBrokenTimerRef.current);
      }
    },
    [],
  );

  const speakFeedback = useSpokenFeedback();

  const handleTap = (): void => {
    if (disabled) return;
    getSfxPlayer().play('chocolateSnap');
    const result = placeQuarter({ placedCount: placed }, target);
    if (!result.accepted) return;
    const next = result.newState.placedCount;
    onChange({ kind: 'equivalence', placedCount: next });
    if (next >= target) {
      speakFeedback(coverStatusText({ placedCount: next }, target));
    }
  };

  const breakIt = useCallback(() => {
    if (disabled) return;
    if (placed <= 0) return;
    getSfxPlayer().play('hammerBreak');
    onChange({ kind: 'equivalence', placedCount: 0 });
    if (justBrokenTimerRef.current !== null) {
      window.clearTimeout(justBrokenTimerRef.current);
    }
    setJustBroken(true);
    justBrokenTimerRef.current = window.setTimeout(() => {
      setJustBroken(false);
      justBrokenTimerRef.current = null;
    }, 900);
  }, [disabled, placed, onChange]);

  // One PointerSensor handles mouse + touch + pen. `distance: 8` means the
  // drag starts as soon as the finger travels 8px (no hold delay → feels
  // instant), while a stationary tap never starts a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.over?.id === TRAY_ID) breakIt();
    },
    [breakIt],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <div className="equivalence-stage">
        <div className="equivalence-material" data-covered={covered || undefined}>
          <TrayDroppable target={target} placed={placed} covered={covered} justBroken={justBroken} />

          <div className="equivalence-rail">
            {!covered && (
              <div className="equivalence-pile" aria-label="pile of quarters">
                {Array.from({ length: pileRemaining }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className="equivalence-quarter"
                    aria-label="place quarter on the whole"
                    onClick={handleTap}
                    disabled={disabled}
                  >
                    <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
                  </button>
                ))}
              </div>
            )}
            {covered && (
              <HammerDraggable disabled={disabled} onKeyboardBreak={breakIt} />
            )}
          </div>
        </div>

        <div
          className={`equivalence-status${covered ? ' is-covered' : ''}`}
          role="status"
          aria-live="polite"
          data-testid="equivalence-status"
        >
          {status}
        </div>
      </div>
    </DndContext>
  );
}

/** Tray = the bar being filled; also the drop target for the hammer. */
function TrayDroppable({
  target,
  placed,
  covered,
  justBroken,
}: {
  readonly target: number;
  readonly placed: number;
  readonly covered: boolean;
  readonly justBroken: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_ID });
  return (
    <div
      ref={setNodeRef}
      className={`equivalence-whole${justBroken ? ' is-breaking' : ''}`}
      data-testid="equivalence-whole"
      aria-label="the whole"
      data-covered={covered || undefined}
      data-over={isOver || undefined}
    >
      {Array.from({ length: target }).map((_, i) => (
        <div
          key={i}
          className="equivalence-slot"
          data-testid="equivalence-slot"
          data-filled={placed > i || undefined}
        >
          {placed > i && (
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Hammer button. The live drag `transform` is applied to the button
 * itself via `translate3d` so it glides smoothly under the finger (no
 * overlay, no size-mismatch). Enter/Space breaks the bar without a drag.
 */
function HammerDraggable({
  disabled,
  onKeyboardBreak,
}: {
  readonly disabled: boolean;
  readonly onKeyboardBreak: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: HAMMER_ID, disabled });

  const style: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`equivalence-hammer${isDragging ? ' is-dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onKeyboardBreak();
      }}
      disabled={disabled}
      aria-label="drag the hammer onto the bar to break it"
    >
      <HammerImage />
    </button>
  );
}

function HammerImage() {
  return (
    <Image
      src="/images/hammer.svg"
      alt=""
      width={HAMMER_PX}
      height={HAMMER_PX}
      draggable={false}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    />
  );
}
