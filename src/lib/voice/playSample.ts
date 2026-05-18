// One-off audio preview used by the name modal's sound check. Lives outside
// the voice player queue so the modal can await the playback and react to it
// directly (e.g. show "I hear it" once the sample finishes).

import { fetchTTS } from './ttsClient';

/** Plays a single TTS sample to completion. Resolves when audio ends; rejects
 *  if the fetch fails or the browser blocks playback. */
export async function playSampleVoice(text: string): Promise<void> {
  const blob = await fetchTTS(text);
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('audio playback failed'));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The greeting the modal plays back. Single source of truth. */
export const SAMPLE_GREETING = "Hi, I'm Ari — can you hear me?";
