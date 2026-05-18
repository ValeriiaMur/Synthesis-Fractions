import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Home page', () => {
  it('renders the getting-started heading', () => {
    render(<Page />);
    expect(
      screen.getByRole('heading', { level: 1, name: /edit the page\.tsx/i }),
    ).toBeInTheDocument();
  });
});
