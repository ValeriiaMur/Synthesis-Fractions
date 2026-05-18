import { describe, it, expect } from 'vitest';
import { titleCaseName } from './titleCaseName';

describe('titleCaseName', () => {
  it('capitalizes a simple lowercase name', () => {
    expect(titleCaseName('lera')).toBe('Lera');
  });

  it('normalizes an all-uppercase name', () => {
    expect(titleCaseName('LERA')).toBe('Lera');
  });

  it('leaves an already title-cased name alone', () => {
    expect(titleCaseName('Lera')).toBe('Lera');
  });

  it('title-cases each word in a multi-word name', () => {
    expect(titleCaseName('mary jane')).toBe('Mary Jane');
  });

  it('preserves and title-cases across a hyphen', () => {
    expect(titleCaseName('mary-jane')).toBe('Mary-Jane');
  });

  it('preserves and title-cases across an apostrophe', () => {
    expect(titleCaseName("o'brien")).toBe("O'Brien");
  });

  it('collapses internal whitespace and trims edges', () => {
    expect(titleCaseName('   ana   sofía  ')).toBe('Ana Sofía');
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(titleCaseName('   ')).toBe('');
  });

  it('handles unicode letters', () => {
    expect(titleCaseName('élodie')).toBe('Élodie');
  });
});
