import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaperFold } from './PaperFold';

describe('PaperFold', () => {
  it('renders an unfolded paper square with no creases on mount', () => {
    render(<PaperFold onChange={() => {}} />);
    expect(screen.getByLabelText('Paper square')).toBeInTheDocument();
    expect(screen.queryAllByTestId('crease')).toHaveLength(0);
  });

  it('reports an empty fold list on mount', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith({ kind: 'paper', folds: [] });
  });

  it('adds the horizontal crease on the first tap', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /fold paper/i }));
    expect(screen.getAllByTestId('crease')).toHaveLength(1);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'paper',
      folds: ['horizontal'],
    });
  });

  it('adds both creases by the second tap', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    const paper = screen.getByRole('button', { name: /fold paper/i });
    fireEvent.click(paper);
    fireEvent.click(paper);
    expect(screen.getAllByTestId('crease')).toHaveLength(2);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'paper',
      folds: ['horizontal', 'vertical'],
    });
  });

  it('resets to no folds on the third tap', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} />);
    const paper = screen.getByRole('button', { name: /fold paper/i });
    fireEvent.click(paper);
    fireEvent.click(paper);
    fireEvent.click(paper);
    expect(screen.queryAllByTestId('crease')).toHaveLength(0);
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'paper', folds: [] });
  });

  it('clears folds when the reset button is pressed', () => {
    render(<PaperFold onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /fold paper/i }));
    fireEvent.click(screen.getByRole('button', { name: /^reset$/i }));
    expect(screen.queryAllByTestId('crease')).toHaveLength(0);
  });

  it('ignores taps when disabled', () => {
    const onChange = vi.fn();
    render(<PaperFold onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('button', { name: /fold paper/i }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'paper', folds: [] });
  });
});
