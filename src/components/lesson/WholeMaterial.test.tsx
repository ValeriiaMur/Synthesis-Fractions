import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WholeMaterial } from './WholeMaterial';
import type { WholeState } from '@/lib/lesson/types';

function Harness() {
  const [state, setState] = useState<WholeState>({ kind: 'whole', split: false });
  return (
    <>
      <WholeMaterial value={state} onChange={setState} />
      <div data-testid="split">{state.split ? 'yes' : 'no'}</div>
    </>
  );
}

describe('WholeMaterial', () => {
  it('renders one tappable whole bar', () => {
    render(<Harness />);
    // A single button represents the whole bar.
    expect(
      screen.getByRole('button', { name: /split.*half/i }),
    ).toBeInTheDocument();
  });

  it('shows an observational prompt to split it in half', () => {
    render(<Harness />);
    const status = screen.getByTestId('whole-status');
    expect(status.textContent ?? '').toMatch(/whole/i);
    expect(status.textContent ?? '').toMatch(/split/i);
  });

  it('tap → split = true and observational success message', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /split.*half/i }));
    expect(screen.getByTestId('split').textContent).toBe('yes');
    const status = screen.getByTestId('whole-status');
    expect(status.textContent ?? '').toMatch(/two halves/i);
    expect(status.className).toMatch(/is-success/);
  });

  it('disabled blocks the tap', () => {
    render(
      <WholeMaterial
        value={{ kind: 'whole', split: false }}
        onChange={() => {
          throw new Error('onChange should not fire when disabled');
        }}
        disabled
      />,
    );
    const btn = screen.getByRole('button', { name: /split.*half/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
  });

  it('hydrates from a split=true value', () => {
    render(
      <WholeMaterial
        value={{ kind: 'whole', split: true }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByTestId('whole-status').textContent ?? '').toMatch(
      /two halves/i,
    );
  });
});
