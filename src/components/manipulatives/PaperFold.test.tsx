import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaperFold } from './PaperFold';

/**
 * The PaperFold manipulative is interaction-rich (pointer-drag folds the
 * paper in 3D). For unit testing we exercise the keyboard fallback on
 * the corner handle (Enter / Space = advance one fold) and the panel
 * buttons (unfold, start over). Drag math is verified visually.
 *
 * The external contract — `onChange({ kind: 'paper', folds })` with
 * `folds` an ordered array of 'horizontal' | 'vertical' — must stay
 * stable: the lesson's `paper_fold_final` beat completes on
 * `folds.length >= targetFolds.length`.
 */
describe('PaperFold', () => {
  it('renders the paper workspace on mount', () => {
    render(<PaperFold onChange={() => {}} />);
    expect(screen.getByLabelText(/paper square/i)).toBeInTheDocument();
  });

  it('reports an empty fold list on mount', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith({ kind: 'paper', folds: [] });
  });

  it('adds the horizontal fold when the corner is activated by keyboard', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    const corner = screen.getByRole('button', { name: /drag this corner/i });
    fireEvent.keyDown(corner, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'paper',
      folds: ['horizontal'],
    });
  });

  it('adds the vertical fold on the second keyboard activation', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /drag this corner/i }), {
      key: 'Enter',
    });
    fireEvent.keyDown(screen.getByRole('button', { name: /drag this corner/i }), {
      key: 'Enter',
    });
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'paper',
      folds: ['horizontal', 'vertical'],
    });
  });

  it('hydrates from a provided value', () => {
    const onChange = vi.fn();
    render(
      <PaperFold
        value={{ kind: 'paper', folds: ['horizontal'] }}
        onChange={onChange}
      />,
    );
    expect(onChange).toHaveBeenCalledWith({
      kind: 'paper',
      folds: ['horizontal'],
    });
  });

  it('steps back one fold when "unfold" is pressed', () => {
    const onChange = vi.fn();
    render(
      <PaperFold
        value={{ kind: 'paper', folds: ['horizontal', 'vertical'] }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /unfold/i }));
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'paper',
      folds: ['horizontal'],
    });
  });

  it('clears all folds when "start over" is pressed', () => {
    const onChange = vi.fn();
    render(
      <PaperFold
        value={{ kind: 'paper', folds: ['horizontal', 'vertical'] }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'paper', folds: [] });
  });

  it('ignores corner-handle activations when disabled', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} disabled />);
    const corner = screen.getByRole('button', { name: /drag this corner/i });
    fireEvent.keyDown(corner, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'paper', folds: [] });
  });
});
