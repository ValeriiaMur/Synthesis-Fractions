import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NamePrompt } from './NamePrompt';

describe('NamePrompt', () => {
  it('renders an input and a submit button', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start|go|begin/i })).toBeInTheDocument();
  });

  it('calls onSubmit with the trimmed name when the button is clicked', () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: '  Lera  ' } });
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));
    expect(onSubmit).toHaveBeenCalledWith('Lera');
  });

  it('submits via the Enter key', () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: 'Mira' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSubmit).toHaveBeenCalledWith('Mira');
  });

  it('does not call onSubmit when the name is empty or whitespace-only', () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the submit button while the input is empty or whitespace', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: /start|go|begin/i })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Nia' },
    });
    expect(screen.getByRole('button', { name: /start|go|begin/i })).not.toBeDisabled();
  });
});
