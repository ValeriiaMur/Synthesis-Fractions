'use client';

import type { CSSProperties } from 'react';
import type { StepDescriptor } from './types';

export type BlockStudioStepperProps = {
  readonly steps: readonly StepDescriptor[];
  readonly stepIdx: number;
  readonly maxStepReached: number;
  readonly stepReady: boolean;
  readonly onSelect: (idx: number) => void;
};

const pillContainer: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0,
  padding: 5,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--line-strong)',
  borderRadius: 999,
};

const dash: CSSProperties = {
  width: 18,
  height: 1,
  background: 'var(--line-strong)',
  margin: '0 2px',
};

function basePillStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 30,
    padding: '0 14px',
    borderRadius: 999,
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--ink-mute)',
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 10.5,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };
}

function numBadgeStyle(active: boolean, done: boolean): CSSProperties {
  return {
    display: 'inline-grid',
    placeItems: 'center',
    width: 18,
    height: 18,
    borderRadius: 999,
    background: active
      ? 'var(--blue)'
      : done
        ? 'rgba(95,216,151,0.15)'
        : 'rgba(255,255,255,0.05)',
    color: active
      ? 'var(--cta-ink)'
      : done
        ? 'var(--green)'
        : 'var(--ink-mute)',
    fontSize: 11,
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontWeight: 500,
  };
}

export function BlockStudioStepper({
  steps,
  stepIdx,
  maxStepReached,
  stepReady,
  onSelect,
}: BlockStudioStepperProps) {
  return (
    <div role="tablist" aria-label="Lesson progress" style={pillContainer}>
      {steps.map((s, i) => {
        const isActive = i === stepIdx;
        const isDone =
          i < maxStepReached || (i === stepIdx && stepReady && s.id !== 'quest');
        const isLocked = i > maxStepReached + 1 || (i > stepIdx && !stepReady);
        const style: CSSProperties = {
          ...basePillStyle(),
          background: isActive
            ? 'var(--ink)'
            : isDone
              ? 'transparent'
              : 'transparent',
          color: isActive
            ? 'var(--bg-0)'
            : isDone
              ? 'var(--green)'
              : 'var(--ink-mute)',
          border: isActive
            ? '1px solid var(--ink)'
            : '1px solid transparent',
          opacity: isLocked ? 0.45 : 1,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        };
        return (
          <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 && <span style={dash} />}
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={isLocked}
              onClick={() => onSelect(i)}
              title={
                isLocked
                  ? 'Complete the current step first'
                  : `Go to step ${s.num}`
              }
              style={style}
            >
              <span style={numBadgeStyle(isActive, isDone && !isActive)}>
                {isDone && !isActive ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M2 5.8L4.4 8.2L9 3.2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s.num
                )}
              </span>
              <span>{s.label}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}
