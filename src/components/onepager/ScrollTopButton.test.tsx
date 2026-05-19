import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ScrollTopButton } from './ScrollTopButton';

function setScrollY(y: number): void {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: y,
  });
  window.dispatchEvent(new Event('scroll'));
}

describe('ScrollTopButton', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
    setScrollY(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is hidden at the top of the page', () => {
    render(<ScrollTopButton />);
    const btn = screen.queryByRole('button', { name: /back to top|go up|top/i });
    // Either not in DOM, or rendered but hidden via aria-hidden / class.
    if (btn) {
      expect(
        btn.getAttribute('aria-hidden') === 'true' ||
          btn.classList.contains('is-hidden') ||
          getComputedStyle(btn).opacity === '0',
      ).toBeTruthy();
    }
  });

  it('appears after the user scrolls past one viewport height', () => {
    render(<ScrollTopButton />);
    act(() => {
      setScrollY(900);
    });
    const btn = screen.getByRole('button', { name: /back to top|go up|top/i });
    expect(btn).toBeVisible();
    expect(btn.getAttribute('aria-hidden')).not.toBe('true');
  });

  it('smooth-scrolls to the top when clicked', () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });

    render(<ScrollTopButton />);
    act(() => {
      setScrollY(2000);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /back to top|go up|top/i }),
    );

    expect(scrollTo).toHaveBeenCalledOnce();
    const arg = scrollTo.mock.calls[0][0];
    expect(arg).toMatchObject({ top: 0, behavior: 'smooth' });
  });
});
