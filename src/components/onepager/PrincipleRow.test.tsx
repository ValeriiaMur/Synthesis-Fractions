import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrincipleRow } from './PrincipleRow';

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (globalThis as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO;
});

describe('PrincipleRow', () => {
  it('renders an intro block when provided', () => {
    render(
      <PrincipleRow
        idx={0}
        num="01"
        color="var(--red)"
        title="Concrete before abstract."
        body="body text"
        demo={<div data-testid="demo" />}
        intro={<div data-testid="row-intro">intro content</div>}
      />,
    );
    expect(screen.getByTestId('row-intro')).toBeInTheDocument();
  });

  it('omits the intro block when not provided', () => {
    render(
      <PrincipleRow
        idx={1}
        num="02"
        color="var(--blue)"
        title="Control of error."
        body="body"
        demo={<div data-testid="demo" />}
      />,
    );
    expect(screen.queryByTestId('row-intro')).not.toBeInTheDocument();
  });
});
