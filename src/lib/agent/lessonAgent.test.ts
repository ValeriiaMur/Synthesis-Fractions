import { describe, it, expect, vi } from 'vitest';
import {
  buildChatMessages,
  isPraiseBombing,
  runLessonAgent,
  type ChatModelLike,
  type LessonAgentInput,
} from './lessonAgent';

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

const scaffoldInput: LessonAgentInput = {
  task: 'scaffold_mc',
  payload: {
    beatId: 'chocolate_check',
    manipulativeKind: 'chocolate',
    question: 'How many quarter-pieces covered the half-space?',
    options: [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
      { id: 'three', label: 'Three' },
      { id: 'four', label: 'Four' },
    ],
    correctOptionId: 'two',
  },
};

const advanceInput: LessonAgentInput = {
  task: 'advance_to_beat',
  payload: {
    fromBeatId: 'chocolate_check',
    toBeatId: 'pizza_explore',
    toBeatKindLabel: 'manipulative — moon-pizza',
    studentName: 'Ben',
  },
};

const chatInput: LessonAgentInput = {
  task: 'chat',
  payload: {
    studentName: 'Ben',
    studentMessage: "i'm stuck",
    currentBeatId: 'chocolate_intro',
    currentBeatProse: 'Here is a chocolate bar.',
    currentBeatKindLabel: 'manipulative — chocolate bar',
    manipulativeKind: 'chocolate',
    recentChat: [
      { from: 'ari', text: 'Hi Ben.' },
      { from: 'user', text: "i'm stuck" },
    ],
  },
};

describe('runLessonAgent — hint', () => {
  it('routes a hint task to the hint node', async () => {
    const llm = llmReturning('Look at the chocolate bar again.');
    const out = await runLessonAgent(hintInput, { llm });
    expect(out.hint).toBe('Look at the chocolate bar again.');
  });

  it('rejects praise in a hint response', async () => {
    const llm = llmReturning('Great job! Look at the bar.');
    await expect(runLessonAgent(hintInput, { llm })).rejects.toThrow(/praise/i);
  });
});

describe('runLessonAgent — paraphrase', () => {
  it('routes a paraphrase task and returns paraphrasedProse', async () => {
    const llm = llmReturning('A chocolate bar sits in front of you.');
    const out = await runLessonAgent(paraphraseInput, { llm });
    expect(out.paraphrasedProse).toBe('A chocolate bar sits in front of you.');
  });

  it('rejects praise in a paraphrase response', async () => {
    const llm = llmReturning('Awesome! Look at the chocolate bar.');
    await expect(runLessonAgent(paraphraseInput, { llm })).rejects.toThrow(
      /praise/i,
    );
  });
});

describe('runLessonAgent — classify_reflection', () => {
  it('returns category + reaction on valid JSON', async () => {
    const llm = llmReturning(
      JSON.stringify({
        category: 'on-topic',
        reaction:
          'You noticed that two smaller pieces took up the same room as one bigger piece.',
      }),
    );
    const out = await runLessonAgent(reflectionInput, { llm });
    expect(out.reflectionCategory).toBe('on-topic');
    expect(out.reflectionReaction).toMatch(/two smaller pieces/);
  });

  it('coerces unknown categories to off-topic', async () => {
    const llm = llmReturning(
      JSON.stringify({ category: 'weird', reaction: 'I noticed your idea.' }),
    );
    const out = await runLessonAgent(reflectionInput, { llm });
    expect(out.reflectionCategory).toBe('off-topic');
  });

  it('rejects praise inside the reaction', async () => {
    const llm = llmReturning(
      JSON.stringify({ category: 'on-topic', reaction: 'Great job noticing!' }),
    );
    await expect(runLessonAgent(reflectionInput, { llm })).rejects.toThrow(
      /praise/i,
    );
  });

  it('throws when JSON is malformed', async () => {
    const llm = llmReturning('not json');
    await expect(runLessonAgent(reflectionInput, { llm })).rejects.toThrow();
  });
});

describe('runLessonAgent — scaffold_mc', () => {
  it('returns paraphrased question + correct option + chosen distractor', async () => {
    const llm = llmReturning(
      JSON.stringify({
        paraphrasedQuestion: 'Count the pieces on the half-tray.',
        keepOptionId: 'three',
      }),
    );
    const out = await runLessonAgent(scaffoldInput, { llm });
    expect(out.scaffoldedMC?.paraphrasedQuestion).toBe(
      'Count the pieces on the half-tray.',
    );
    expect(out.scaffoldedMC?.reducedOptions.map((o) => o.id)).toEqual([
      'two',
      'three',
    ]);
  });

  it('throws when the model picks the correct option as distractor', async () => {
    const llm = llmReturning(
      JSON.stringify({
        paraphrasedQuestion: 'Count again.',
        keepOptionId: 'two',
      }),
    );
    await expect(runLessonAgent(scaffoldInput, { llm })).rejects.toThrow(
      /equals correct/i,
    );
  });

  it('throws when keepOptionId is not in the original options', async () => {
    const llm = llmReturning(
      JSON.stringify({
        paraphrasedQuestion: 'Count again.',
        keepOptionId: 'seventeen',
      }),
    );
    await expect(runLessonAgent(scaffoldInput, { llm })).rejects.toThrow(
      /not in option list/i,
    );
  });

  it('rejects praise in the paraphrased question', async () => {
    const llm = llmReturning(
      JSON.stringify({
        paraphrasedQuestion: 'Great job! Count again.',
        keepOptionId: 'three',
      }),
    );
    await expect(runLessonAgent(scaffoldInput, { llm })).rejects.toThrow(
      /praise/i,
    );
  });
});

describe('runLessonAgent — advance_to_beat', () => {
  it('returns the in-world acknowledgement line', async () => {
    const llm = llmReturning('The moon outpost comes into view.');
    const out = await runLessonAgent(advanceInput, { llm });
    expect(out.advanceLine).toBe('The moon outpost comes into view.');
  });

  it('rejects praise in the advance line', async () => {
    const llm = llmReturning('Perfect! On to the next stop.');
    await expect(runLessonAgent(advanceInput, { llm })).rejects.toThrow(
      /praise/i,
    );
  });
});

describe('runLessonAgent — chat (blocking fallback path)', () => {
  it('returns a chat reply on success', async () => {
    const llm = llmReturning('Tap two squares onto the tray and look.');
    const out = await runLessonAgent(chatInput, { llm });
    expect(out.chatReply).toBe('Tap two squares onto the tray and look.');
  });

  it('rejects praise in the chat reply', async () => {
    const llm = llmReturning("Awesome! You've got this.");
    await expect(runLessonAgent(chatInput, { llm })).rejects.toThrow(/praise/i);
  });
});

describe('buildChatMessages', () => {
  it('includes the student name, current beat prose, and recent chat in the final human message', () => {
    const messages = buildChatMessages(chatInput.payload);
    // [System, ...few-shot Human/AI pairs, Human(actual user message)]
    expect(messages.length).toBeGreaterThanOrEqual(2);
    const human = messages[messages.length - 1].content as string;
    expect(human).toContain('Ben');
    expect(human).toContain('Here is a chocolate bar.');
    expect(human).toContain("i'm stuck");
    expect(human).toContain('ARI: Hi Ben.');
  });

  it('handles the no-active-beat case', () => {
    const messages = buildChatMessages({
      studentName: 'Ben',
      studentMessage: 'hello',
      currentBeatId: null,
      currentBeatProse: null,
      currentBeatKindLabel: null,
      manipulativeKind: null,
      recentChat: [],
    });
    const human = messages[messages.length - 1].content as string;
    expect(human).toContain('No active beat yet.');
    expect(human).toContain('(no recent chat)');
  });
});

describe('isPraiseBombing', () => {
  it('flags the canonical praise words', () => {
    expect(isPraiseBombing('Great job, you got this!')).toBe(true);
    expect(isPraiseBombing('PERFECT effort')).toBe(true);
  });

  it('does not flag neutral observational text', () => {
    expect(
      isPraiseBombing('Two quarters cover the same space as one half.'),
    ).toBe(false);
  });
});
