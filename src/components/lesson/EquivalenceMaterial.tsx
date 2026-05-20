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

/** Unit-based sizing — one quarter = one UNIT_PX square, four of them
 *  side-by-side make the whole bar (matches the WholeMaterial). */
const UNIT_PX = 80;
const PILE_INITIAL = 4;
const HAMMER_PX = 56;

const HAMMER_ID = 'equivalence-hammer';
const TRAY_ID = 'equivalence-tray';
const QUARTER_ID_PREFIX = 'equivalence-quarter-';

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
 * The kid DRAGS quarters from the pile and drops them onto the bar; each
 * drop fills the next empty slot. Four placed = the whole fills
 * (data-covered) and the beat completes. A tap alone does nothing — the
 * interaction is drag-and-drop.
 *
 * Once filled, a square hammer appears. Drag it onto the bar → the
 * chocolate breaks (placedCount → 0, pile refills).
 *
 * Both the quarters and the hammer are @dnd-kit draggables under one
 * DndContext; the live `transform` is applied to each so it glides under
 * the finger (no overlay). `pointerWithin` decides the drop by finger
 * position over the tray. `onDragEnd` routes by the dragged id: a quarter
 * places one, the hammer breaks. Enter/Space on a focused piece is the
 * keyboard fallback (and the test path).
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

  const placeOne = useCallback(() => {
    if (disabled) return;
    const result = placeQuarter({ placedCount: placed }, target);
    if (!result.accepted) return;
    getSfxPlayer().play('chocolateSnap');
    onChange({ kind: 'equivalence', placedCount: result.newState.placedCount });
  }, [disabled, placed, target, onChange]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.over?.id !== TRAY_ID) return;
      if (String(event.active.id) === HAMMER_ID) breakIt();
      else placeOne();
    },
    [breakIt, placeOne],
  );

  const help = covered
    ? 'drag the hammer onto the bar to break it'
    : 'drag a quarter onto the bar →';

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
                  <QuarterDraggable
                    key={i}
                    id={`${QUARTER_ID_PREFIX}${i}`}
                    disabled={disabled}
                    onKeyboardPlace={placeOne}
                  />
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
        <div className="equivalence-help" data-testid="equivalence-help">
          {help}
        </div>
      </div>
    </DndContext>
  );
}

/** Tray = the bar being filled; also the drop target for quarters + the
 *  hammer. */
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

/** A draggable pile quarter. The live drag transform is applied to the
 *  button so it glides under the finger. Enter/Space places one (keyboard
 *  fallback + tests). A plain tap does nothing — placement is by drag. */
function QuarterDraggable({
  id,
  disabled,
  onKeyboardPlace,
}: {
  readonly id: string;
  readonly disabled: boolean;
  readonly onKeyboardPlace: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled });
  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`equivalence-quarter${isDragging ? ' is-dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onKeyboardPlace();
      }}
      disabled={disabled}
      aria-label="drag a quarter onto the bar"
    >
      <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
    </button>
  );
}

/**
 * Hammer button — same smooth single-draggable pattern. Enter/Space
 * breaks the bar without a drag.
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
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
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
