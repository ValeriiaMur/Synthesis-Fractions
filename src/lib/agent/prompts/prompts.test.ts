import { describe, it, expect } from 'vitest';
import {
  ADVANCE_FEW_SHOT,
  ADVANCE_SYSTEM,
  CHAT_FEW_SHOT,
  CHAT_SYSTEM,
  HINT_FEW_SHOT,
  HINT_SYSTEM,
  REFLECTION_FEW_SHOT,
  REFLECTION_SYSTEM,
  SCAFFOLD_FEW_SHOT,
  SCAFFOLD_SYSTEM,
} from './index';

const ALL = [
  { name: 'hint', system: HINT_SYSTEM, fewShot: HINT_FEW_SHOT },
  {
    name: 'reflection',
    system: REFLECTION_SYSTEM,
    fewShot: REFLECTION_FEW_SHOT,
  },
  { name: 'scaffold', system: SCAFFOLD_SYSTEM, fewShot: SCAFFOLD_FEW_SHOT },
  { name: 'advance', system: ADVANCE_SYSTEM, fewShot: ADVANCE_FEW_SHOT },
  { name: 'chat', system: CHAT_SYSTEM, fewShot: CHAT_FEW_SHOT },
];

describe('prompts/', () => {
  for (const p of ALL) {
    describe(p.name, () => {
      it('exports a non-empty SYSTEM string', () => {
        expect(typeof p.system).toBe('string');
        expect(p.system.length).toBeGreaterThan(50);
      });

      it('exports at least one few-shot example', () => {
        expect(p.fewShot.length).toBeGreaterThanOrEqual(1);
      });

      it('every few-shot example has non-empty input + output', () => {
        for (const ex of p.fewShot) {
          expect(typeof ex.input).toBe('string');
          expect(ex.input.length).toBeGreaterThan(0);
          expect(typeof ex.output).toBe('string');
          expect(ex.output.length).toBeGreaterThan(0);
        }
      });

      it('every few-shot output is praise-free', () => {
        const banned =
          /\b(great job|awesome|perfect|amazing|well done|good job|fantastic|nice work|you got this)\b/i;
        for (const ex of p.fewShot) {
          expect(banned.test(ex.output)).toBe(false);
        }
      });
    });
  }

  it('reflection few-shots are valid JSON in the required shape', () => {
    for (const ex of REFLECTION_FEW_SHOT) {
      const parsed = JSON.parse(ex.output) as Record<string, unknown>;
      expect(typeof parsed.category).toBe('string');
      expect(typeof parsed.reaction).toBe('string');
      expect(['on-topic', 'partial', 'off-topic']).toContain(parsed.category);
    }
  });

  it('scaffold few-shots are valid JSON with paraphrasedQuestion + keepOptionId', () => {
    for (const ex of SCAFFOLD_FEW_SHOT) {
      const parsed = JSON.parse(ex.output) as Record<string, unknown>;
      expect(typeof parsed.paraphrasedQuestion).toBe('string');
      expect(typeof parsed.keepOptionId).toBe('string');
    }
  });
});
