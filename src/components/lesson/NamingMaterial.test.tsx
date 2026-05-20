import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NamingMaterial } from './NamingMaterial';
import type { NamingConfig, NamingState } from '@/lib/lesson/types';

function Harness({ config }: { config: NamingConfig }) {
  const [state, setState] = useState<NamingState>({ kind: 'naming', streak: 0 });
  return (
    <>
      <NamingMaterial config={config} value={state} onChange={setState} />
      <div data-testid="streak">{state.streak}</div>
    </>
  );
}

const halvesOnly: NamingConfig = { kind: 'naming', fractions: ['half'], masteryStreak: 3 };
const quartersOnly: NamingConfig = {
  kind: 'naming',
  fractions: ['quarter'],
  masteryStreak: 3,
};
const mixed: NamingConfig = {
  kind: 'naming',
  fractions: ['half', 'quarter'],
  masteryStreak: 4,
};

describe('NamingMaterial layout', () => {
  it('L1 halves-only: renders 2 half-tagged regions, no prompt label', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    expect(pieces).toHaveLength(2);
    pieces.forEach((p) => expect(p.dataset.kind).toBe('half'));
    expect(screen.queryByText(/tap the/i)).toBeNull();
  });

  it('L2 quarters-only: renders 4 quarter-tagged regions, no prompt label', () => {
    render(<Harness config={quartersOnly} />);
    const pieces = screen.getAllByRole('button');
    expect(pieces).toHaveLength(4);
    pieces.forEach((p) => expect(p.dataset.kind).toBe('quarter'));
    expect(screen.queryByText(/tap the/i)).toBeNull();
  });

  it('L3 mixed: renders 1 half + 4 quarters and shows the prompt label', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    expect(pieces).toHaveLength(5);
    expect(pieces[0].dataset.kind).toBe('half');
    pieces.slice(1).forEach((p) => expect(p.dataset.kind).toBe('quarter'));
    expect(screen.getByText(/tap the/i)).toBeInTheDocument();
  });
});

describe('NamingMaterial tap behavior', () => {
  it('L1: any region tap increments the streak', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    expect(screen.getByTestId('streak').textContent).toBe('1');
    fireEvent.click(pieces[1]);
    expect(screen.getByTestId('streak').textContent).toBe('2');
  });

  it('L2: any quarter tap increments the streak', () => {
    render(<Harness config={quartersOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[2]);
    expect(screen.getByTestId('streak').textContent).toBe('1');
  });

  it('L3: tapping the half on a "half" prompt increments streak', () => {
    render(<Harness config={mixed} />);
    // First prompt is "half" by convention.
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]); // the half tile
    expect(screen.getByTestId('streak').textContent).toBe('1');
  });

  it('L3: tapping a quarter on a "half" prompt is silent (streak unchanged)', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[1]); // a quarter on the half-prompt
    expect(screen.getByTestId('streak').textContent).toBe('0');
  });

  it('L3: prompt cycles half → quarter → half after each correct tap', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');

    // Round 1: prompt = half → tap half-tile.
    expect(screen.getByText('half')).toBeInTheDocument();
    fireEvent.click(pieces[0]);
    expect(screen.getByTestId('streak').textContent).toBe('1');

    // Round 2: prompt = quarter → tap a quarter-tile.
    expect(screen.getByText('quarter')).toBeInTheDocument();
    fireEvent.click(pieces[1]);
    expect(screen.getByTestId('streak').textContent).toBe('2');

    // Round 3: prompt back to half.
    expect(screen.getByText('half')).toBeInTheDocument();
  });

  it('disabled prop blocks all taps', () => {
    render(
      <NamingMaterial
        config={halvesOnly}
        value={{ kind: 'naming', streak: 0 }}
        onChange={() => {
          throw new Error('onChange should not fire when disabled');
        }}
        disabled
      />,
    );
    const pieces = screen.getAllByRole('button');
    pieces.forEach((p) => expect(p).toBeDisabled());
    fireEvent.click(pieces[0]);
  });

  it('lift animation marks the tapped region', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    expect(pieces[0].dataset.lifted).toBe('true');
  });
});

describe('NamingMaterial observational feedback', () => {
  it('L1: correct tap shows a success feedback line naming the half', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    const fb = screen.getByTestId('naming-feedback');
    expect(fb.textContent ?? '').toMatch(/half/i);
    expect(fb.className).toMatch(/is-success/);
  });

  it('L3 wrong tap: observation feedback names the tapped kind + points back', () => {
    render(<Harness config={mixed} />);
    // First prompt is "half" — tap a quarter (idx 1) to trigger an observation.
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[1]);
    const fb = screen.getByTestId('naming-feedback');
    expect(fb.textContent ?? '').toMatch(/quarter/i);
    expect(fb.textContent ?? '').toMatch(/find the half/i);
    expect(fb.className).toMatch(/is-observation/);
    // Streak unchanged — control-of-error preserved.
    expect(screen.getByTestId('streak').textContent).toBe('0');
  });
});
