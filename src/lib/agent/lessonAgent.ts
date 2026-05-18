// Server-only. The lesson agent: a LangGraph StateGraph routed by task type.
//
// Entry point: runLessonAgent({ task, payload }, { llm })
// Nodes: hint | paraphrase | classify_reflection
// All three share the Montessori discipline floor (no praise-bombing).

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { BeatId } from '@/lib/lesson/types';

export type ManipulativeKind = 'chocolate' | 'pizza' | 'paper';

export type HintPayload = {
  readonly manipulativeKind: ManipulativeKind;
  readonly question: string;
  readonly correctOptionLabel: string;
  readonly selectedOptionLabel: string;
  readonly attemptCount: number;
};

export type ParaphrasePayload = {
  readonly beatId: BeatId;
  readonly originalProse: string;
};

export type ReflectionCategory = 'on-topic' | 'partial' | 'off-topic';

export type ReflectionPayload = {
  readonly beatId: BeatId;
  readonly reflectionText: string;
  readonly manipulativeKind: ManipulativeKind;
};

export type LessonAgentInput =
  | { readonly task: 'hint'; readonly payload: HintPayload }
  | { readonly task: 'paraphrase'; readonly payload: ParaphrasePayload }
  | { readonly task: 'classify_reflection'; readonly payload: ReflectionPayload };

export type LessonAgentOutput = {
  readonly hint?: string;
  readonly paraphrasedProse?: string;
  readonly reflectionCategory?: ReflectionCategory;
  readonly reflectionReaction?: string;
};

type ContentBlock = { readonly type?: string; readonly text?: string };

type InvokeResponse = {
  readonly content: string | ReadonlyArray<ContentBlock | string>;
};

export type ChatModelLike = {
  readonly invoke: (messages: BaseMessage[]) => Promise<InvokeResponse>;
};

export type LessonAgentDeps = {
  readonly llm: ChatModelLike;
};

// ---------------------------------------------------------------------------
// Shared discipline

const PRAISE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bgreat job\b/i,
  /\bawesome\b/i,
  /\bperfect\b/i,
  /\bamazing\b/i,
  /\bwell done\b/i,
  /\bgood job\b/i,
  /\bfantastic\b/i,
  /\bnice work\b/i,
  /\byou got this\b/i,
];

function assertNoPraise(text: string, where: string): void {
  for (const pattern of PRAISE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `${where}: praise-bombing detected, rejecting output (matched ${pattern})`,
      );
    }
  }
}

function extractText(content: InvokeResponse['content']): string {
  if (typeof content === 'string') return content;
  return content
    .map((block) => {
      if (typeof block === 'string') return block;
      if (block.type === 'text' && typeof block.text === 'string') return block.text;
      return '';
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Node prompts

const HINT_SYSTEM = `You are a quiet, observational math tutor for a 7-10 year old learning that 1/2 = 2/4.

A learner has just chosen the wrong answer to a multiple-choice question while a hands-on activity (a chocolate bar, a pizza, or a folded paper square) is on screen in front of them.

Write ONE short hint (one or two sentences, simple vocabulary) that:
1. Names what the learner is looking at on screen (the specific material).
2. Redirects them back to that material with a concrete observation or action they can try.
3. Never reveals the correct answer outright.
4. Never criticizes the learner or names their wrong choice as wrong.

This is Montessori-style guidance — observational, not evaluative. Strict rules:
- Do NOT use praise words: "great job", "awesome", "perfect", "amazing", "well done", "good job", "fantastic", "nice".
- Do NOT use generic encouragement ("you got this", "almost there").
- Do NOT use exclamation marks for praise. A calm period is fine.

Output ONLY the hint text. No preamble, no quotation marks, no labels.`;

const PARAPHRASE_SYSTEM = `You rewrite one paragraph of narration for a math lesson aimed at a 7-10 year old learning that 1/2 = 2/4.

You will receive one paragraph. Rewrite it so the wording feels slightly different from the original, but the meaning, the named material, and the action the learner is invited to take are unchanged. The new paragraph must be similar in length and tone.

Strict rules:
- Keep the same instructions, the same named material, and the same fraction values.
- One or two short sentences. Simple vocabulary.
- Calm, observational, picture-book tone. No exclamation marks for emphasis.
- Do NOT use praise words: "great job", "awesome", "perfect", "amazing", "well done", "good job", "fantastic", "nice".
- Do NOT add commentary about how easy or fun this is.

Output ONLY the rewritten paragraph. No preamble, no quotation marks, no labels.`;

const REFLECTION_SYSTEM = `You are reading a short written observation from a 7-10 year old in the middle of a fraction-equivalence lesson (1/2 = 2/4). A specific material (a chocolate bar, a pizza, or a folded paper square) is on screen.

Do two things:

1. Classify the observation as exactly one of:
   - "on-topic": names something true about the material and fractions/equivalence/size
   - "partial": touches the material but does not connect to fractions or sizes
   - "off-topic": unrelated to the material or to fractions

2. Write ONE short reaction (one sentence, simple vocabulary) that:
   - Names what the learner described, in your own words.
   - Does not praise, evaluate, or judge ("great", "right", "wrong", "good", "perfect", etc. are all forbidden).
   - Does not correct or extend the math; the material teaches, not you.

Return ONLY a JSON object on a single line, with exactly these fields:
{"category": "on-topic" | "partial" | "off-topic", "reaction": "..."}

No preamble. No code fences. No extra text.`;

// ---------------------------------------------------------------------------
// Node implementations

async function hintNode(
  payload: HintPayload,
  llm: ChatModelLike,
): Promise<{ readonly hint: string }> {
  const user = [
    `Activity on screen: ${payload.manipulativeKind}.`,
    `Question: "${payload.question}"`,
    `Correct answer (do not reveal): "${payload.correctOptionLabel}".`,
    `Learner just chose: "${payload.selectedOptionLabel}".`,
    `Wrong attempt number: ${payload.attemptCount}.`,
    `Write the hint now.`,
  ].join('\n');

  const response = await llm.invoke([
    new SystemMessage(HINT_SYSTEM),
    new HumanMessage(user),
  ]);
  const text = extractText(response.content).trim();
  if (!text) throw new Error('hintNode: empty model response');
  assertNoPraise(text, 'hintNode');
  return { hint: text };
}

async function paraphraseNode(
  payload: ParaphrasePayload,
  llm: ChatModelLike,
): Promise<{ readonly paraphrasedProse: string }> {
  const user = [
    `Beat id: ${payload.beatId}.`,
    `Original paragraph:`,
    payload.originalProse,
    `Rewrite the paragraph now.`,
  ].join('\n');

  const response = await llm.invoke([
    new SystemMessage(PARAPHRASE_SYSTEM),
    new HumanMessage(user),
  ]);
  const text = extractText(response.content).trim();
  if (!text) throw new Error('paraphraseNode: empty model response');
  assertNoPraise(text, 'paraphraseNode');
  return { paraphrasedProse: text };
}

const REFLECTION_CATEGORIES: ReadonlyArray<ReflectionCategory> = [
  'on-topic',
  'partial',
  'off-topic',
];

function parseReflectionJSON(raw: string): {
  readonly category: ReflectionCategory;
  readonly reaction: string;
} {
  const trimmed = raw.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('reflectionNode: model did not return valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('reflectionNode: model JSON is not an object');
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.reaction !== 'string' || obj.reaction.trim() === '') {
    throw new Error('reflectionNode: missing reaction');
  }
  const rawCategory = typeof obj.category === 'string' ? obj.category : '';
  const category: ReflectionCategory = REFLECTION_CATEGORIES.includes(
    rawCategory as ReflectionCategory,
  )
    ? (rawCategory as ReflectionCategory)
    : 'off-topic';
  return { category, reaction: obj.reaction.trim() };
}

async function reflectionNode(
  payload: ReflectionPayload,
  llm: ChatModelLike,
): Promise<{
  readonly reflectionCategory: ReflectionCategory;
  readonly reflectionReaction: string;
}> {
  const user = [
    `Beat id: ${payload.beatId}.`,
    `Material on screen: ${payload.manipulativeKind}.`,
    `Learner wrote: "${payload.reflectionText}"`,
    `Return the JSON now.`,
  ].join('\n');

  const response = await llm.invoke([
    new SystemMessage(REFLECTION_SYSTEM),
    new HumanMessage(user),
  ]);
  const raw = extractText(response.content);
  const { category, reaction } = parseReflectionJSON(raw);
  assertNoPraise(reaction, 'reflectionNode');
  return { reflectionCategory: category, reflectionReaction: reaction };
}

// ---------------------------------------------------------------------------
// Graph

const AgentAnnotation = Annotation.Root({
  input: Annotation<LessonAgentInput>(),
  output: Annotation<LessonAgentOutput>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
});

type AgentGraphState = typeof AgentAnnotation.State;

function buildLessonGraph(llm: ChatModelLike) {
  const hint = async (state: AgentGraphState): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'hint') {
      throw new Error('hint node invoked for non-hint task');
    }
    const result = await hintNode(state.input.payload, llm);
    return { output: result };
  };

  const paraphrase = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'paraphrase') {
      throw new Error('paraphrase node invoked for non-paraphrase task');
    }
    const result = await paraphraseNode(state.input.payload, llm);
    return { output: result };
  };

  const classifyReflection = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'classify_reflection') {
      throw new Error('reflection node invoked for non-reflection task');
    }
    const result = await reflectionNode(state.input.payload, llm);
    return { output: result };
  };

  return new StateGraph(AgentAnnotation)
    .addNode('hint', hint)
    .addNode('paraphrase', paraphrase)
    .addNode('classify_reflection', classifyReflection)
    .addConditionalEdges(START, (state: AgentGraphState) => state.input.task, {
      hint: 'hint',
      paraphrase: 'paraphrase',
      classify_reflection: 'classify_reflection',
    })
    .addEdge('hint', END)
    .addEdge('paraphrase', END)
    .addEdge('classify_reflection', END)
    .compile();
}

export async function runLessonAgent(
  input: LessonAgentInput,
  deps: LessonAgentDeps,
): Promise<LessonAgentOutput> {
  const graph = buildLessonGraph(deps.llm);
  const result = await graph.invoke({ input });
  return result.output;
}
