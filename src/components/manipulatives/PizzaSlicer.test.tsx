import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PizzaSlicer } from './PizzaSlicer';

describe('PizzaSlicer', () => {
  it('renders the pizza on mount', () => {
    render(<PizzaSlicer onChange={() => {}} />);
    expect(screen.getByLabelText(/pizza/i)).toBeInTheDocument();
  });

  it('reports two slices on mount when no value is provided', () => {
    const onChange = vi.fn();
    render(<PizzaSlicer onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith({ kind: 'pizza', sliceCount: 2 });
  });

  it('reports sliceCount: 4 when the user picks the 4 button', () => {
    const onChange = vi.fn();
    render(<PizzaSlicer onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /cut into 4 slices/i }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'pizza', sliceCount: 4 });
  });

  it('reports sliceCount: 8 when the user picks the 8 button', () => {
    const onChange = vi.fn();
    render(<PizzaSlicer onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /cut into 8 slices/i }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'pizza', sliceCount: 8 });
  });

  it('hydrates from the provided value', () => {
    const onChange = vi.fn();
    render(
      <PizzaSlicer
        value={{ kind: 'pizza', sliceCount: 6 }}
        onChange={onChange}
      />,
    );
    expect(onChange).toHaveBeenCalledWith({ kind: 'pizza', sliceCount: 6 });
    const six = screen.getByRole('button', { name: /cut into 6 slices/i });
    expect(six).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables the slice-count buttons when disabled prop is set', () => {
    render(<PizzaSlicer onChange={() => {}} disabled />);
    expect(
      screen.getByRole('button', { name: /cut into 4 slices/i }),
    ).toBeDisabled();
  });
});
