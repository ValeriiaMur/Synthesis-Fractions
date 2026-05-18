'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { playSampleVoice, SAMPLE_GREETING } from '@/lib/voice/playSample';

export type NamePromptProps = {
  readonly onSubmit: (name: string) => void;
};

type AudioGateState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'playing' }
  | { readonly kind: 'played' }
  | { readonly kind: 'error' }
  | { readonly kind: 'confirmed' };

/**
 * Cosmos-styled modal that asks the learner for their name before the lesson
 * begins. Gated by a sound check: the learner plays a short greeting from
 * Ari and confirms they can hear it. The user gesture also satisfies the
 * browser's autoplay policy, so the lesson's in-flight voice can play
 * without further interaction.
 */
export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState('');
  const [audio, setAudio] = useState<AudioGateState>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const audioConfirmed = audio.kind === 'confirmed';

  useEffect(() => {
    if (audioConfirmed) inputRef.current?.focus();
  }, [audioConfirmed]);

  const trimmed = name.trim();
  const canSubmit = audioConfirmed && trimmed.length > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  const handlePlay = async () => {
    setAudio({ kind: 'playing' });
    try {
      await playSampleVoice(SAMPLE_GREETING);
      setAudio({ kind: 'played' });
    } catch {
      setAudio({ kind: 'error' });
    }
  };

  const handleConfirmHeard = () => {
    setAudio({ kind: 'confirmed' });
  };

  return (
    <div
      className="name-prompt cosmos-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-prompt-title"
    >
      <div className="name-prompt-backdrop" aria-hidden />
      <form className="name-prompt-card" onSubmit={handleSubmit} noValidate>
        <div className="name-prompt-tag">
          <span className="dot" aria-hidden />
          before we begin
        </div>
        <h2 id="name-prompt-title">
          What should <span className="acc-b">Ari</span> call you?
        </h2>
        <p className="name-prompt-sub">
          Your name will show up in the story and in the chat with Ari.
        </p>

        <div className="name-prompt-audio-check" aria-live="polite">
          {audio.kind === 'idle' && (
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePlay}
            >
              Play a sound to test
            </button>
          )}
          {audio.kind === 'playing' && (
            <span className="name-prompt-audio-status">Playing…</span>
          )}
          {audio.kind === 'played' && (
            <div className="name-prompt-audio-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmHeard}
              >
                I hear it
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={handlePlay}
              >
                Play again
              </button>
            </div>
          )}
          {audio.kind === 'error' && (
            <div className="name-prompt-audio-actions">
              <span className="name-prompt-audio-status">
                Couldn&rsquo;t play the sound.
              </span>
              <button
                type="button"
                className="btn-ghost"
                onClick={handlePlay}
              >
                Try again
              </button>
            </div>
          )}
          {audio.kind === 'confirmed' && (
            <span className="name-prompt-audio-status name-prompt-audio-ok">
              ✓ sound on
            </span>
          )}
        </div>

        <label className="name-prompt-field">
          <span className="sr-only">Your name</span>
          <input
            ref={inputRef}
            type="text"
            aria-label="Your name"
            placeholder="Type your name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="off"
            disabled={!audioConfirmed}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          Let&rsquo;s begin
          <span className="btn-arrow" aria-hidden>
            →
          </span>
        </button>
      </form>
    </div>
  );
}
