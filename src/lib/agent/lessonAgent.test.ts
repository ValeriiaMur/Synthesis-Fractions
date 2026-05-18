import { describe, it, expect, vi } from 'vitest';
import { runLessonAgent, type ChatModelLike, type LessonAgentInput } from './lessonAgent';

function llmReturning(text: string): ChatModelLike {
  return {
    invoke: vi.fn().mockResolvedValue({ content: text }),
  };
}

const hintInput: LessonAgentInput = {
  task: 'hint',
  payload: {
    manipulativeKind: 'chocolate',
    question: 'How many quarter-pieces covered the half-space?',
    correctOptionLabel: 'Two',
    selectedOptionLabel: 'Three',
    attemptCount: 1,
  },
};

const paraphraseInput: LessonAgentInput = {
  task: 'paraphrase',
  payload: {
    beatId: 'chocolate_intro',
    originalProse: 'Here is a chocolate bar.',
  },
};

const reflectionInput: LessonAgentInput = {
  task: 'classify_reflection',
  payload: {
    beatId: 'chocolate_intro',
    reflectionText: 'The two small pieces look the same size as the big piece.',
    manipulativeKind: 'chocolate',
  },
};

describe('runLessonAgent', () => {
  it('routes a hint task to the hint node and returns the hint', async () => {
    const llm = llmReturning('Look at the chocolate bar again.');
    const out = await runLessonAgent(hintInput, { llm });
    expect(out.hint).toBe('Look at the chocolate bar again.');
    expect(out.paraphrasedProse).toBeUndefined();
    expect(out.reflectionCategory).toBeUndefined();
  });

  it('rejects praise-bombing in a hint response', async () => {
    const llm = llmReturning('Great job! Look at the chocolate bar again.');
    await expect(runLessonAgent(hintInput, { llm })).rejects.toThrow(/praise/i);
  });

  it('routes a paraphrase task to the paraphrase node and returns paraphrasedProse', async () => {
    const llm = llmReturning('A chocolate bar sits in front of you.');
    const out = await runLessonAgent(paraphraseInput, { llm });
    expect(out.paraphrasedProse).toBe('A chocolate bar sits in front of you.');
    expect(out.hint).toBeUndefined();
  });

  it('rejects praise-bombing in a paraphrase response', async () => {
    const llm = llmReturning('Awesome! Look at the chocolate bar.');
    await expect(runLessonAgent(paraphraseInput, { llm })).rejects.toThrow(/praise/i);
  });

  it('routes a classify_reflection task and returns category + reaction', async () => {
    const llm = llmReturning(
      JSON.stringify({
        category: 'on-topic',
        reaction: 'You noticed that two smaller pieces took up the same room as one bigger piece.',
      }),
    );
    const out = await runLessonAgent(reflectionInput, { llm });
    expect(out.reflectionCategory).toBe('on-topic');
    expect(out.reflectionReaction).toBe(
      'You noticed that two smaller pieces took up the same room as one bigger piece.',
    );
  });

  it('coerces an unknown reflection category to off-topic (defensive)', async () => {
    const llm = llmReturning(
      JSON.stringify({ category: 'something-else', reaction: 'I noticed your idea.' }),
    );
    const out = await runLessonAgent(reflectionInput, { llm });
    expect(out.reflectionCategory).toBe('off-topic');
  });

  it('throws when classify_reflection JSON is malformed', async () => {
    const llm = llmReturning('not json at all');
    await expect(runLessonAgent(reflectionInput, { llm })).rejects.toThrow();
  });

  it('rejects praise-bombing inside a reflection reaction', async () => {
    const llm = llmReturning(
      JSON.stringify({ category: 'on-topic', reaction: 'Great job noticing that!' }),
    );
    await expect(runLessonAgent(reflectionInput, { llm })).rejects.toThrow(/praise/i);
  });
});
