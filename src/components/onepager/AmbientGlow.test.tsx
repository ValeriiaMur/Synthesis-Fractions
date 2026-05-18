import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AmbientGlow } from './AmbientGlow';

describe('AmbientGlow', () => {
  it('renders a fixed-position, screen-blended layer', () => {
    render(<AmbientGlow color="var(--red)" />);
    const el = screen.getByTestId('ambient-glow');
    expect(el.style.position).toBe('fixed');
    expect(el.style.mixBlendMode).toBe('screen');
    expect(el.style.pointerEvents).toBe('none');
  });

  it('fades to 0 opacity when no principle is active', () => {
    render(<AmbientGlow color={null} />);
    const el = screen.getByTestId('ambient-glow');
    expect(el.style.opacity).toBe('0');
    // jsdom serializes inline `background-image: none` literally.
    expect(el.style.backgroundImage).toBe('none');
  });

  it('paints two radial gradients tinted to the active color', () => {
    render(<AmbientGlow color="var(--green)" />);
    const el = screen.getByTestId('ambient-glow');
    expect(el.style.backgroundImage).toContain('radial-gradient');
    // hexA('var(--green)', 0.18) = rgba(95, 216, 151, 0.18)
    expect(el.style.backgroundImage).toContain('95, 216, 151');
  });
});
