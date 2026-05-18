import { describe, it, expect, vi } from 'vitest';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { generateHint, type ChatModelLike, type HintInput } from './generateHint';

const baseInput: HintInput = {
  manipulativeKind: 'chocolate',
  question: 'How many quarter-pieces covered the half-space?',
  correctOptionLabel: 'Two',
  selectedOptionLabel: 'Three',
  attemptCount: 1,
};

function llmReturning(text: string): ChatModelLike {
  return {
    invoke: vi.fn().mockResolvedValue({ content: text }),
  };
}

describe('generateHint (LangGraph node)', () => {
  it('returns the trimmed hint text from the model', async () => {
    const llm = llmReturning('   Look at the chocolate bar.   ');
    const hint = await generateHint(baseInput, { llm });
    expect(hint).toBe('Look at the chocolate bar.');
  });

  it('invokes the model with a SystemMessage containing Montessori discipline', async () => {
    const llm = llmReturning('Look at the chocolate bar.');
    await generateHint(baseInput, { llm });
    const messages = (llm.invoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // Few-shot examples sit between system + the live user message, so the
    // message list is `[System, ...few-shot Human/AI pairs, Human]`.
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]).toBeInstanceOf(SystemMessage);
    const system = String(messages[0].content).toLowerCase();
    expect(system).toContain('great job');
    expect(system).toMatch(/redirect.*material|name what.*looking at|observ/);
  });

  it('invokes the model with a final HumanMessage containing the activity, wrong choice, and attempt', async () => {
    const llm = llmReturning('Look at the chocolate bar.');
    await generateHint(baseInput, { llm });
    const messages = (llm.invoke as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const last = messages[messages.length - 1];
    expect(last).toBeInstanceOf(HumanMessage);
    const user = String(last.content);
    expect(user).toContain('chocolate');
    expect(user).toContain('Three');
    expect(user).toContain('1');
  });

  it('throws when the model response has no text content', async () => {
    const llm: ChatModelLike = {
      invoke: vi.fn().mockResolvedValue({ content: '' }),
    };
    await expect(generateHint(baseInput, { llm })).rejects.toThrow();
  });

  it('throws when the model response is a praise-bombing phrase (defense-in-depth)', async () => {
    const llm = llmReturning('Great job! Try again with two pieces.');
    await expect(generateHint(baseInput, { llm })).rejects.toThrow(/praise/i);
  });

  it('handles complex content blocks (array form) from LangChain message responses', async () => {
    const llm: ChatModelLike = {
      invoke: vi
        .fn()
        .mockResolvedValue({ content: [{ type: 'text', text: 'Look at the bar.' }] }),
    };
    const hint = await generateHint(baseInput, { llm });
    expect(hint).toBe('Look at the bar.');
  });
});
