import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ChocolateBar } from './ChocolateBar';

const PIECE_NAME = /quarter piece/i;

describe('ChocolateBar', () => {
  it('renders four quarter-pieces and a half-space drop area', () => {
    render(<ChocolateBar onChange={() => {}} />);
    expect(screen.getAllByRole('button', { name: PIECE_NAME })).toHaveLength(4);
    expect(screen.getByTestId('half-space')).toBeInTheDocument();
  });

  it('reports state with zero pieces on the half-space on mount', () => {
    const onChange = vi.fn();
    render(<ChocolateBar onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith({
      kind: 'chocolate',
      piecesOnReference: 0,
    });
  });

  it('moves a piece onto the half-space when tapped', () => {
    const onChange = vi.fn();
    render(<ChocolateBar onChange={onChange} />);
    const pieces = screen.getAllByRole('button', { name: PIECE_NAME });
    fireEvent.click(pieces[0]);
    const halfSpace = screen.getByTestId('half-space');
    expect(within(halfSpace).getAllByRole('button', { name: PIECE_NAME })).toHaveLength(1);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'chocolate',
      piecesOnReference: 1,
    });
  });

  it('reports piecesOnReference: 2 once two pieces are placed on the half-space', () => {
    const onChange = vi.fn();
    render(<ChocolateBar onChange={onChange} />);
    const firstPiece = screen.getAllByRole('button', { name: PIECE_NAME })[0];
    fireEvent.click(firstPiece);
    const nextPiece = screen.getAllByRole('button', { name: PIECE_NAME })[1];
    fireEvent.click(nextPiece);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'chocolate',
      piecesOnReference: 2,
    });
  });

  it('returns a piece to the bar when tapped again', () => {
    const onChange = vi.fn();
    render(<ChocolateBar onChange={onChange} />);
    const firstPiece = screen.getByRole('button', { name: /quarter piece 1/i });
    fireEvent.click(firstPiece);
    const movedPiece = screen.getByRole('button', { name: /quarter piece 1/i });
    fireEvent.click(movedPiece);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'chocolate',
      piecesOnReference: 0,
    });
  });

  it('ignores taps when disabled', () => {
    const onChange = vi.fn();
    render(<ChocolateBar onChange={onChange} disabled />);
    const piece = screen.getAllByRole('button', { name: PIECE_NAME })[0];
    fireEvent.click(piece);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'chocolate',
      piecesOnReference: 0,
    });
  });
});
