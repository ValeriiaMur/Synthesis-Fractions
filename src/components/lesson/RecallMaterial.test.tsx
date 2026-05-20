import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecallMaterial } from './RecallMaterial';
import type { RecallConfig, RecallState } from '@/lib/lesson/types';

const speakMock = vi.fn();
vi.mock('@/lib/voice/voicePlayer', () => ({
  getVoicePlayer: () => ({
    speak: speakMock,
    stop: vi.fn(),
    setMuted: vi.fn(),
    isMuted: () => false,
    subscribe: () => () => {},
  }),
}));

const halfConfig: RecallConfig = { kind: 'recall', fraction: 'half' };

function Harness({ config = halfConfig }: { config?: RecallConfig }) {
  const [state, setState] = useState<RecallState>({
    kind: 'recall',
    revealed: false,
  });
  return (
    <>
      <RecallMaterial config={config} value={state} onChange={setState} />
      <div data-testid="revealed">{state.revealed ? 'yes' : 'no'}</div>
    </>
  );
}

beforeEach(() => {
  speakMock.mockReset();
});

describe('RecallMaterial', () => {
  it('asks "what is this?" and offers a reveal before the answer', () => {
    render(<Harness />);
    expect(screen.getByText(/what is this/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show me/i })).toBeInTheDocument();
    expect(screen.queryByTestId('recall-answer')).toBeNull();
  });

  it('reveal: sets revealed, names it back, and shows the answer line', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /show me/i }));
    expect(screen.getByTestId('revealed').textContent).toBe('yes');
    expect(screen.getByTestId('recall-answer').textContent ?? '').toMatch(/half/i);
    // The tutor voice names it back.
    expect(speakMock).toHaveBeenCalledWith("yes — that's a half.");
  });

  it('names a quarter when configured for quarter', () => {
    render(<Harness config={{ kind: 'recall', fraction: 'quarter' }} />);
    fireEvent.click(screen.getByRole('button', { name: /show me/i }));
    expect(screen.getByTestId('recall-answer').textContent ?? '').toMatch(
      /quarter/i,
    );
  });

  it('disabled blocks the reveal', () => {
    render(
      <RecallMaterial
        config={halfConfig}
        value={{ kind: 'recall', revealed: false }}
        onChange={() => {
          throw new Error('onChange should not fire when disabled');
        }}
        disabled
      />,
    );
    const btn = screen.getByRole('button', { name: /show me/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
  });
});
