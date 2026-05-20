import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquivalenceMaterial } from './EquivalenceMaterial';
import type { EquivalenceConfig, EquivalenceState } from '@/lib/lesson/types';

const config: EquivalenceConfig = { kind: 'equivalence', targetCount: 2 };

function Harness() {
  const [state, setState] = useState<EquivalenceState>({
    kind: 'equivalence',
    placedCount: 0,
  });
  return (
    <>
      <EquivalenceMaterial config={config} value={state} onChange={setState} />
      <div data-testid="placed">{state.placedCount}</div>
    </>
  );
}

describe('EquivalenceMaterial — chocolate tap-to-cover', () => {
  it('renders one half + a pile of quarter buttons', () => {
    render(<Harness />);
    expect(screen.getByLabelText(/one half/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });

  it('shows two empty slots on the half before any taps', () => {
    render(<Harness />);
    const slots = screen.getAllByTestId('equivalence-slot');
    expect(slots).toHaveLength(2);
    slots.forEach((s) => expect(s.dataset.filled).toBeUndefined());
  });

  it('first quarter tap: placedCount 0 → 1, slot 0 fills', () => {
    render(<Harness />);
    const pile = screen.getAllByLabelText(/place quarter/i);
    fireEvent.click(pile[0]);
    expect(screen.getByTestId('placed').textContent).toBe('1');
    const slots = screen.getAllByTestId('equivalence-slot');
    expect(slots[0].dataset.filled).toBe('true');
    expect(slots[1].dataset.filled).toBeUndefined();
  });

  it('second tap: placedCount 1 → 2, both slots filled, half is covered', () => {
    render(<Harness />);
    const pile0 = screen.getAllByLabelText(/place quarter/i);
    fireEvent.click(pile0[0]);
    const pile1 = screen.getAllByLabelText(/place quarter/i);
    fireEvent.click(pile1[0]);
    expect(screen.getByTestId('placed').textContent).toBe('2');
    const slots = screen.getAllByTestId('equivalence-slot');
    expect(slots[0].dataset.filled).toBe('true');
    expect(slots[1].dataset.filled).toBe('true');
    const half = screen.getByLabelText(/one half/i);
    expect(half.dataset.covered).toBe('true');
  });

  it('extra taps after coverage are silent — placedCount stays at target', () => {
    render(<Harness />);
    // Fill it.
    const a = screen.getAllByLabelText(/place quarter/i);
    fireEvent.click(a[0]);
    fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    expect(screen.getByTestId('placed').textContent).toBe('2');

    // No more pile buttons should be enabled.
    const remaining = screen.queryAllByLabelText(/place quarter/i);
    remaining.forEach((b) => {
      // Either gone from the DOM or disabled — both are valid auto-corrections.
      if (b.isConnected) expect(b).toBeDisabled();
    });
  });

  it('shows an observational status line at every step', () => {
    render(<Harness />);
    // Empty state
    expect(screen.getByTestId('equivalence-status').textContent ?? '').toMatch(
      /tap a quarter/,
    );
    // One placed
    fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    expect(screen.getByTestId('equivalence-status').textContent ?? '').toMatch(
      /one more/,
    );
    // Both placed — equivalence stated outright
    fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    expect(screen.getByTestId('equivalence-status').textContent ?? '').toMatch(
      /two quarters/,
    );
  });

  it('disabled blocks all taps even when not yet covered', () => {
    render(
      <EquivalenceMaterial
        config={config}
        value={{ kind: 'equivalence', placedCount: 0 }}
        onChange={() => {
          throw new Error('onChange should not fire when disabled');
        }}
        disabled
      />,
    );
    const pile = screen.getAllByLabelText(/place quarter/i);
    pile.forEach((b) => expect(b).toBeDisabled());
    fireEvent.click(pile[0]);
  });
});
