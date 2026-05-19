'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * sessionStorage key that records "the unveil has already played this tab".
 * Exported so tests can probe it without duplicating the magic string.
 */
export const UNVEIL_SESSION_KEY = 'synthesis:unveil-played';

/** How long the intro animation runs end-to-end before unmounting (ms). */
const UNVEIL_DURATION_MS = 1900;

/**
 * Read the "already played" flag from sessionStorage, guarded so SSR and
 * locked-down browsers (private mode, storage disabled) never throw.
 */
function hasUnveilPlayed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(UNVEIL_SESSION_KEY) === '1';
  } catch {
    // Treat any storage error as "first visit". Showing the unveil is the
    // safer default — it's a 1.9s animation, not a destructive operation.
    return false;
  }
}

/** Stamp the flag, ignoring storage errors for the same reason as above. */
function markUnveilPlayed(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(UNVEIL_SESSION_KEY, '1');
  } catch {
    // No-op: if storage is unavailable we simply replay next navigation.
  }
}

/**
 * useSyncExternalStore plumbing for the sessionStorage flag.
 *
 * - `subscribe` is a no-op: we never observe other tabs/code mutating the
 *   flag, only our own one-shot write at the end of the animation. The
 *   timer-driven re-render is enough to reflect the change.
 * - `getServerSnapshot` returns `false` on the server so SSR always emits
 *   the overlay markup (and the `.unveil ~ .page-reveal` rule hides the
 *   page underneath at first paint, preventing FOUC).
 * - `getClientSnapshot` reads the real flag. React handles the SSR→CSR
 *   transition internally: on a repeat visit it re-renders to `null`
 *   right after hydration without warning. This is the canonical
 *   replacement for "synchronously call setState in an effect to sync
 *   with external storage" — and satisfies `react-hooks/set-state-in-effect`.
 */
const subscribeUnveilFlag = (): (() => void) => () => undefined;
const getServerSnapshot = (): boolean => false;

/**
 * On-load intro overlay for the home page. A small dark-navy square grows
 * from the center of a cream viewport until it fills the screen and
 * "becomes" the page underneath. Plays exactly once per browser session:
 * sessionStorage gates the mount so internal navigations don't replay it.
 *
 * Lives as a sibling to the page content (NOT a wrapper) so the page can
 * fade in underneath via `.page-reveal` without waiting for the unveil
 * to finish — keeps Time-to-Interactive low.
 */
export function Unveil(): React.ReactElement | null {
  // Read the sessionStorage flag via useSyncExternalStore so the value is
  // consistent across SSR/CSR boundaries without a `setState`-in-effect.
  // Server snapshot is always `false` (no window) — the overlay renders
  // server-side so `.unveil ~ .page-reveal` hides the page at first
  // paint. On a repeat visit the client snapshot reads `true` and React
  // reconciles to `null` right after hydration: one frame of fully
  // styled overlay, then it's gone.
  const flagAlreadySet = useSyncExternalStore(
    subscribeUnveilFlag,
    hasUnveilPlayed,
    getServerSnapshot,
  );

  // `done` flips at the END of the animation. We don't initialise it
  // from the flag — that would re-introduce the SSR/CSR drift and the
  // unstyled-text flash. The animation timer below is the single source
  // of truth for first-visit completion.
  const [done, setDone] = useState<boolean>(false);

  useEffect(() => {
    // Repeat visit: the storage hook already told React to render null.
    // Nothing to schedule.
    if (flagAlreadySet) return;
    // First visit: schedule the stamp + unmount for AFTER the animation
    // completes. React Strict Mode (Next.js default in dev) deliberately
    // mounts → unmounts → remounts on the first cycle; if we stamped at
    // mount, the second mount would short-circuit and the user would
    // never see the animation. Cleanup clears the unfinished first
    // timer so no flag is stamped before the real run.
    const timer = window.setTimeout(() => {
      markUnveilPlayed();
      setDone(true);
    }, UNVEIL_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [flagAlreadySet]);

  if (flagAlreadySet || done) return null;

  return (
    <div className="unveil" data-testid="unveil" aria-hidden="true">
      <div className="unveil-square" data-testid="unveil-square" />
      <div className="unveil-tag">synthesis tutor</div>
    </div>
  );
}
