'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

export type NamePromptProps = {
  readonly onSubmit: (name: string) => void;
};

/**
 * Cosmos-styled modal that asks the learner for their name before the lesson
 * begins. The submitted name is trimmed; empty / whitespace-only input is
 * rejected. Auto-focuses the input on mount so the learner can just type.
 */
export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  return (
    <div className="name-prompt cosmos-bg" role="dialog" aria-modal="true" aria-labelledby="name-prompt-title">
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
