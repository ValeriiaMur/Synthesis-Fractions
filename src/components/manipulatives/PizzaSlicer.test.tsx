import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PizzaSlicer } from './PizzaSlicer';

describe('PizzaSlicer', () => {
  it('renders the pizza on mount', () => {
    render(<PizzaSlicer onChange={() => {}} />);
    expect(screen.getByLabelText(/pizza/i)).toBeInTheDocument();
  });

  it('reports two slices on mount', () => {
    const onChange = vi.fn();
    render(<PizzaSlicer onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith({ kind: 'pizza', sliceCount: 2 });
  });

  it('reports sliceCount: 4 once the knife slider crosses the halfway point', () => {
    const onChange = vi.fn();
    render(<PizzaSlicer onChange={onChange} />);
    const slider = screen.getByRole('slider', { name: /knife/i });
    fireEvent.change(slider, { target: { value: '1' } });
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'pizza', sliceCount: 4 });
  });

  it('stays at sliceCount: 2 when the knife slider is below the halfway point', () => {
    const onChange = vi.fn();
    render(<PizzaSlicer onChange={onChange} />);
    const slider = screen.getByRole('slider', { name: /knife/i });
    fireEvent.change(slider, { target: { value: '0.3' } });
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'pizza', sliceCount: 2 });
  });

  it('disables the slider when disabled prop is set', () => {
    render(<PizzaSlicer onChange={() => {}} disabled />);
    expect(screen.getByRole('slider', { name: /knife/i })).toBeDisabled();
  });
});
