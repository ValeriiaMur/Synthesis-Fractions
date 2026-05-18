import type { Beat } from './types';
import { stripMarkup } from './stripMarkup';
import { lookupHint } from './completes';

/**
 * Mirrors the keyword router in /reference/app.jsx.
 * Returns Ari's reply for a free-form student message. The current beat
 * provides context (which manipulative is active, what MC hints to surface).
 */
export function aiReplyTo(
  userMsg: string,
  currentBeat: Beat | undefined,
  studentName: string,
): string {
  const txt = userMsg.toLowerCase().trim();

  if (/^(hi|hello|hey)/.test(txt)) {
    return `Hi ${studentName}. Let's look at the piece in front of you.`;
  }

  if (/stuck|help|hint/.test(txt) && currentBeat?.mc) {
    return (
      lookupHint(currentBeat.mc.canonicalHints, 0) ??
      "Let's slow down and look at the material again."
    );
  }
  if (
    /stuck|help|hint/.test(txt) &&
    currentBeat?.manipulative?.kind === 'chocolate'
  ) {
    return 'Try placing two quarter-pieces side by side on the half-space below. See what happens.';
  }
  if (
    /stuck|help|hint/.test(txt) &&
    currentBeat?.manipulative?.kind === 'pizza'
  ) {
    return 'Drag the slider slowly. Watch the new cut appear across the pizza.';
  }
  if (
    /stuck|help|hint/.test(txt) &&
    currentBeat?.manipulative?.kind === 'paper'
  ) {
    return 'Tap the paper once to fold it. Then tap it again to fold the other way.';
  }

  if (/show me|again|repeat/.test(txt)) {
    return currentBeat ? stripMarkup(currentBeat.prose) : "Let's start at the top.";
  }

  if (/next|what now|continue|done/.test(txt)) {
    return currentBeat?.manipulative
      ? "Try the piece in front of you — when you've done it, the next cell will open."
      : "Pick the answer you think is right. If it's wrong, that's fine — we'll talk it through.";
  }

  if (/why/.test(txt)) {
    return 'Because the same amount can be cut into different-sized equal pieces. Notice what stays the same as the pieces change.';
  }

  if (/what|how/.test(txt) && currentBeat?.manipulative?.kind === 'chocolate') {
    return 'Tap two quarter-pieces onto the half-space and count what you see.';
  }
  if (/what|how/.test(txt) && currentBeat?.manipulative?.kind === 'pizza') {
    return 'Drag the knife — watch the slices appear, then count them.';
  }
  if (/what|how/.test(txt) && currentBeat?.manipulative?.kind === 'paper') {
    return 'Tap the paper to make a fold. Then tap once more.';
  }

  return "Look at what's in front of you. Tell me what you notice — even small things count.";
}
