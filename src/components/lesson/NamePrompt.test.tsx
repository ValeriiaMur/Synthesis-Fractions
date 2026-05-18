import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

let resolveSample: (() => void) | null = null;
let rejectSample: ((e: Error) => void) | null = null;
const playSampleMock = vi.fn<(text: string) => Promise<void>>();

vi.mock('@/lib/voice/playSample', () => ({
  playSampleVoice: (text: string) => playSampleMock(text),
  SAMPLE_GREETING: "Hi, I'm Ari — can you hear me?",
}));

import { NamePrompt } from './NamePrompt';

beforeEach(() => {
  playSampleMock.mockReset();
  playSampleMock.mockImplementation(
    () =>
      new Promise<void>((resolve, reject) => {
        resolveSample = resolve;
        rejectSample = reject;
      }),
  );
  resolveSample = null;
  rejectSample = null;
});

describe('NamePrompt', () => {
  it('renders an input and a submit button', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start|go|begin/i }),
    ).toBeInTheDocument();
  });

  it('starts with a sound-check button and the name field disabled', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    expect(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /name/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /start|go|begin/i }),
    ).toBeDisabled();
  });

  it('calls playSampleVoice with the greeting when the sound check is clicked', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    expect(playSampleMock).toHaveBeenCalledWith("Hi, I'm Ari — can you hear me?");
  });

  it('reveals the "I hear it" confirm button after the sample finishes playing', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );

    // While playing, no confirm button yet.
    expect(screen.queryByRole('button', { name: /i hear it|yes/i })).toBeNull();

    await act(async () => {
      resolveSample?.();
    });

    expect(
      await screen.findByRole('button', { name: /i hear it|yes/i }),
    ).toBeInTheDocument();
  });

  it('enables the name field after the user confirms they heard the sample', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    await act(async () => {
      resolveSample?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /i hear it|yes/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /name/i })).not.toBeDisabled();
    });
  });

  it('submits the trimmed name after the audio gate is passed', async () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    await act(async () => {
      resolveSample?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /i hear it|yes/i }));

    const input = await screen.findByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: '  Lera  ' } });
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));

    expect(onSubmit).toHaveBeenCalledWith('Lera');
  });

  it('lets the user retry when the sample playback errors out', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );

    await act(async () => {
      rejectSample?.(new Error('blocked'));
    });

    // After failure, the play button is offered again.
    expect(
      await screen.findByRole('button', {
        name: /play (a )?sound|test sound|try again|hear/i,
      }),
    ).toBeInTheDocument();
    // Name field still disabled — audio not confirmed.
    expect(screen.getByRole('textbox', { name: /name/i })).toBeDisabled();
  });

  it('does not submit when the name is whitespace-only even after audio is confirmed', async () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    await act(async () => {
      resolveSample?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /i hear it|yes/i }));

    const input = await screen.findByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
