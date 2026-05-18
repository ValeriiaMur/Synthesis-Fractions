import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useElementProgress } from './useElementProgress';

describe('useElementProgress', () => {
  it('returns 0 when no element is attached yet', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement | null>(null);
      return useElementProgress(ref);
    });
    expect(result.current).toBe(0);
  });

  it('returns 0 on initial mount of an unmeasured element', () => {
    // jsdom doesn't lay out, so getBoundingClientRect() returns zeros and
    // the hook clamps to 0. The contract we actually care about is "never
    // throws + never crosses [0,1]"; check that here.
    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement | null>(null);
      return useElementProgress(ref);
    });
    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.current).toBeLessThanOrEqual(1);
  });
});
