import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Unveil, UNVEIL_SESSION_KEY } from './Unveil';

/**
 * Behaviour we lock in:
 *  1. First visit (no sessionStorage flag): the overlay mounts, then unmounts
 *     after ~1.9s and stamps the flag so it won't appear again.
 *  2. Subsequent navigations within the same tab (flag is present): nothing
 *     renders at all — no flash of overlay.
 *  3. The component cleans up its timer on unmount so test teardown and
 *     route changes never leak timeouts.
 */
describe('Unveil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it('renders the cream overlay on first visit', () => {
    render(<Unveil />);
    expect(screen.getByTestId('unveil')).toBeInTheDocument();
    expect(screen.getByTestId('unveil-square')).toBeInTheDocument();
    expect(screen.getByText(/synthesis tutor/i)).toBeInTheDocument();
  });

  it('does NOT stamp the session flag at mount — only when the animation completes', () => {
    // This guards the React-Strict-Mode behaviour: Next.js (dev) mounts →
    // unmounts → remounts on the first render cycle. If we stamped at mount,
    // the second mount would see the flag and short-circuit, so the visitor
    // would never see the animation. The flag must wait for completion.
    render(<Unveil />);
    expect(window.sessionStorage.getItem(UNVEIL_SESSION_KEY)).toBeNull();
  });

  it('unmounts after 1.9s and stamps the session flag at that point', () => {
    render(<Unveil />);
    expect(screen.getByTestId('unveil')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(screen.queryByTestId('unveil')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(UNVEIL_SESSION_KEY)).toBe('1');
  });

  it('survives a Strict-Mode-style remount: cleanup before completion leaves the flag unset', () => {
    const { unmount } = render(<Unveil />);
    // Advance partway through the animation, then unmount before the timer
    // fires — simulating the first half of React's strict-mode dance.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    unmount();
    expect(window.sessionStorage.getItem(UNVEIL_SESSION_KEY)).toBeNull();

    // The "remount" then plays the animation in full.
    render(<Unveil />);
    expect(screen.getByTestId('unveil')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(window.sessionStorage.getItem(UNVEIL_SESSION_KEY)).toBe('1');
  });

  it('renders nothing when the session flag is already set', () => {
    window.sessionStorage.setItem(UNVEIL_SESSION_KEY, '1');
    const { container } = render(<Unveil />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('unveil')).not.toBeInTheDocument();
  });

  it('marks the overlay as decorative for assistive tech', () => {
    render(<Unveil />);
    expect(screen.getByTestId('unveil').getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
