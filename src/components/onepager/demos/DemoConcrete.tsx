'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { OrderToggle } from './OrderToggle';

type OrderKind = 'textbook' | 'ours';
type StepKind = 'abstract' | 'rule' | 'manip';
type Step = { readonly kind: StepKind; readonly text: string };

const SEQUENCES: Readonly<Record<OrderKind, readonly Step[]>> = {
  textbook: [
    { kind: 'abstract', text: '½ = ²⁄₄' },
    { kind: 'rule', text: 'An equivalent fraction has the same value.' },
    { kind: 'manip', text: 'Now try the workbook.' },
  ],
  ours: [
    { kind: 'manip', text: 'Place quarter-pieces on the half-space.' },
    { kind: 'manip', text: 'Slice the pizza. Fold the paper.' },
    { kind: 'abstract', text: 'Then — and only then — ½ = ²⁄₄.' },
  ],
};

const KIND_COLOR: Readonly<Record<StepKind, { dot: string; label: string }>> = {
  abstract: { dot: 'var(--red)', label: 'abstract' },
  rule: { dot: 'var(--yellow)', label: 'rule' },
  manip: { dot: 'var(--green)', label: 'manipulate' },
};

function OrderStep({
  step,
  index,
}: {
  readonly step: Step;
  readonly index: number;
}) {
  const c = KIND_COLOR[step.kind];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        fontSize: 14.5,
        color: 'var(--ink)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--ink-mute)',
          letterSpacing: '0.1em',
          minWidth: 18,
        }}
      >
        {index}.
      </span>
      <span
        style={{
          width: 8,
          height: 8,
          background: c.dot,
          borderRadius: 2,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.12em',
          color: c.dot,
          textTransform: 'uppercase',
          minWidth: 80,
        }}
      >
        {c.label}
      </span>
      <span style={{ color: 'var(--ink-soft)', flex: 1 }}>{step.text}</span>
    </div>
  );
}

export function DemoConcrete() {
  const [order, setOrder] = useState<OrderKind>('ours');
  const seq = SEQUENCES[order];

  return (
    <DemoFrame label="lesson order">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <OrderToggle
          label="textbook way"
          active={order === 'textbook'}
          onClick={() => setOrder('textbook')}
        />
        <OrderToggle
          label="our way"
          active={order === 'ours'}
          onClick={() => setOrder('ours')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {seq.map((s, i) => (
          <OrderStep key={`${order}-${i}`} step={s} index={i + 1} />
        ))}
      </div>
    </DemoFrame>
  );
}
