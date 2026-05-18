// Server-only. The lesson agent: a LangGraph StateGraph routed by task type.
//
// Entry point: runLessonAgent({ task, payload }, { llm })
// Nodes: hint | paraphrase | classify_reflection | scaffold_mc | advance_to_beat | chat
// All nodes share the Montessori discipline floor (no praise-bombing).
//
// Streaming chat lives OUTSIDE the graph: the SSE route imports
// `buildChatMessages(payload)` from this file and pipes
// `llm.stream(messages)` directly. That keeps the graph for tasks that
// benefit from router + post-filter, and gives the chat path low-latency
// streaming without graph machinery.

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { BeatId } from '@/lib/lesson/types';
import {
  ADVANCE_FEW_SHOT,
  ADVANCE_SYSTEM,
  CHAT_FEW_SHOT,
  CHAT_SYSTEM,
  HINT_FEW_SHOT,
  HINT_SYSTEM,
  PARAPHRASE_FEW_SHOT,
  PARAPHRASE_SYSTEM,
  REFLECTION_FEW_SHOT,
  REFLECTION_SYSTEM,
  SCAFFOLD_FEW_SHOT,
  SCAFFOLD_SYSTEM,
  type FewShotExample,
} from './prompts';

export type ManipulativeKind = 'chocolate' | 'pizza' | 'paper' | 'fractionbox';

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

export type ScaffoldMCOption = {
  readonly id: string;
  readonly label: string;
};

export type ScaffoldMCPayload = {
  readonly beatId: BeatId;
  readonly manipulativeKind: ManipulativeKind;
  readonly question: string;
  readonly options: readonly ScaffoldMCOption[];
  readonly correctOptionId: string;
};

export type ScaffoldedMC = {
  readonly paraphrasedQuestion: string;
  /** Always exactly the correct option + one plausible distractor. */
  readonly reducedOptions: readonly ScaffoldMCOption[];
};

export type AdvancePayload = {
  readonly fromBeatId: BeatId | null;
  readonly toBeatId: BeatId;
  readonly toBeatKindLabel: string;
  readonly studentName: string;
};

export type ChatPayload = {
  readonly studentName: string;
  readonly studentMessage: string;
  readonly currentBeatId: BeatId | null;
  readonly currentBeatProse: string | null;
  readonly currentBeatKindLabel: string | null;
  readonly manipulativeKind: ManipulativeKind | null;
  /** Most recent chat turns, oldest → newest, for context. */
  readonly recentChat: ReadonlyArray<{
    readonly from: 'ari' | 'user' | 'system';
    readonly text: string;
  }>;
};

export type LessonAgentInput =
  | { readonly task: 'hint'; readonly payload: HintPayload }
  | { readonly task: 'paraphrase'; readonly payload: ParaphrasePayload }
  | {
      readonly task: 'classify_reflection';
      readonly payload: ReflectionPayload;
    }
  | { readonly task: 'scaffold_mc'; readonly payload: ScaffoldMCPayload }
  | { readonly task: 'advance_to_beat'; readonly payload: AdvancePayload }
  | { readonly task: 'chat'; readonly payload: ChatPayload };

export type LessonAgentOutput = {
  readonly hint?: string;
  readonly paraphrasedProse?: string;
  readonly reflectionCategory?: ReflectionCategory;
  readonly reflectionReaction?: string;
  readonly scaffoldedMC?: ScaffoldedMC;
  readonly advanceLine?: string;
  readonly chatReply?: string;
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

export function isPraiseBombing(text: string): boolean {
  return PRAISE_PATTERNS.some((p) => p.test(text));
}

function assertNoPraise(text: string, where: string): void {
  if (isPraiseBombing(text)) {
    throw new Error(`${where}: praise-bombing detected, rejecting output`);
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
// Message construction
//
// Each node sends: [SystemMessage(system), ...few-shot Human/AI pairs, HumanMessage(user)]
// Few-shots live in src/lib/agent/prompts/* alongside the SYSTEM string.

function fewShotMessages(examples: readonly FewShotExample[]): BaseMessage[] {
  const out: BaseMessage[] = [];
  for (const ex of examples) {
    out.push(new HumanMessage(ex.input));
    out.push(new AIMessage(ex.output));
  }
  return out;
}

function buildMessages(
  system: string,
  fewShots: readonly FewShotExample[],
  user: string,
): BaseMessage[] {
  return [
    new SystemMessage(system),
    ...fewShotMessages(fewShots),
    new HumanMessage(user),
  ];
}

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

  const response = await llm.invoke(
    buildMessages(HINT_SYSTEM, HINT_FEW_SHOT, user),
  );
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

  const response = await llm.invoke(
    buildMessages(PARAPHRASE_SYSTEM, PARAPHRASE_FEW_SHOT, user),
  );
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

  const response = await llm.invoke(
    buildMessages(REFLECTION_SYSTEM, REFLECTION_FEW_SHOT, user),
  );
  const raw = extractText(response.content);
  const { category, reaction } = parseReflectionJSON(raw);
  assertNoPraise(reaction, 'reflectionNode');
  return { reflectionCategory: category, reflectionReaction: reaction };
}

function parseScaffoldJSON(
  raw: string,
  validIds: ReadonlySet<string>,
  correctId: string,
): {
  readonly paraphrasedQuestion: string;
  readonly keepOptionId: string;
} {
  const trimmed = raw.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('scaffoldNode: model did not return valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('scaffoldNode: model JSON is not an object');
  }
  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.paraphrasedQuestion !== 'string' ||
    obj.paraphrasedQuestion.trim() === ''
  ) {
    throw new Error('scaffoldNode: missing paraphrasedQuestion');
  }
  if (typeof obj.keepOptionId !== 'string') {
    throw new Error('scaffoldNode: missing keepOptionId');
  }
  if (!validIds.has(obj.keepOptionId)) {
    throw new Error('scaffoldNode: keepOptionId not in option list');
  }
  if (obj.keepOptionId === correctId) {
    throw new Error('scaffoldNode: keepOptionId equals correct option');
  }
  return {
    paraphrasedQuestion: obj.paraphrasedQuestion.trim(),
    keepOptionId: obj.keepOptionId,
  };
}

async function scaffoldMCNode(
  payload: ScaffoldMCPayload,
  llm: ChatModelLike,
): Promise<{ readonly scaffoldedMC: ScaffoldedMC }> {
  const correct = payload.options.find((o) => o.id === payload.correctOptionId);
  if (!correct) {
    throw new Error('scaffoldNode: correctOptionId not found in options');
  }
  const user = [
    `Material on screen: ${payload.manipulativeKind}.`,
    `Beat id: ${payload.beatId}.`,
    `Original question: "${payload.question}"`,
    `Options:`,
    ...payload.options.map((o) => `  - id="${o.id}" label="${o.label}"`),
    `Correct option id: "${payload.correctOptionId}".`,
    `Return the JSON now.`,
  ].join('\n');

  const response = await llm.invoke(
    buildMessages(SCAFFOLD_SYSTEM, SCAFFOLD_FEW_SHOT, user),
  );
  const raw = extractText(response.content);
  const validIds = new Set(payload.options.map((o) => o.id));
  const { paraphrasedQuestion, keepOptionId } = parseScaffoldJSON(
    raw,
    validIds,
    payload.correctOptionId,
  );
  assertNoPraise(paraphrasedQuestion, 'scaffoldNode');
  const distractor = payload.options.find((o) => o.id === keepOptionId);
  if (!distractor) throw new Error('scaffoldNode: distractor lookup failed');
  // Always keep the correct option first so the visual order is stable.
  const reducedOptions: readonly ScaffoldMCOption[] = [correct, distractor];
  return {
    scaffoldedMC: { paraphrasedQuestion, reducedOptions },
  };
}

async function advanceNode(
  payload: AdvancePayload,
  llm: ChatModelLike,
): Promise<{ readonly advanceLine: string }> {
  const user = [
    `Student name: ${payload.studentName}.`,
    `Just finished: ${payload.fromBeatId ?? '(none — first beat)'}.`,
    `Opening: ${payload.toBeatId} (${payload.toBeatKindLabel}).`,
    `Write the in-world acknowledgement now.`,
  ].join('\n');

  const response = await llm.invoke(
    buildMessages(ADVANCE_SYSTEM, ADVANCE_FEW_SHOT, user),
  );
  const text = extractText(response.content).trim();
  if (!text) throw new Error('advanceNode: empty model response');
  assertNoPraise(text, 'advanceNode');
  return { advanceLine: text };
}

/**
 * Build the system + human messages for the streaming chat path. The SSE
 * route imports this and feeds the returned messages directly into
 * `llm.stream()`. One source of truth for the chat system prompt.
 */
export function buildChatMessages(payload: ChatPayload): BaseMessage[] {
  const beatContext = payload.currentBeatId
    ? [
        `On-screen activity: ${payload.manipulativeKind ?? 'none'}.`,
        `Current beat id: ${payload.currentBeatId}.`,
        `Current beat kind: ${payload.currentBeatKindLabel ?? 'unknown'}.`,
        payload.currentBeatProse
          ? `Current beat prose (verbatim):\n${payload.currentBeatProse}`
          : 'Current beat prose: (none).',
      ].join('\n')
    : 'No active beat yet.';

  const recent = payload.recentChat.length
    ? payload.recentChat
        .map((m) => `${m.from.toUpperCase()}: ${m.text}`)
        .join('\n')
    : '(no recent chat)';

  const user = [
    `Student name: ${payload.studentName}.`,
    beatContext,
    `Recent chat (oldest → newest):`,
    recent,
    `New message from the student:`,
    payload.studentMessage,
    `Write Ari's reply now.`,
  ].join('\n\n');

  return [
    new SystemMessage(CHAT_SYSTEM),
    ...fewShotMessages(CHAT_FEW_SHOT),
    new HumanMessage(user),
  ];
}

async function chatNode(
  payload: ChatPayload,
  llm: ChatModelLike,
): Promise<{ readonly chatReply: string }> {
  const messages = buildChatMessages(payload);
  const response = await llm.invoke(messages);
  const text = extractText(response.content).trim();
  if (!text) throw new Error('chatNode: empty model response');
  assertNoPraise(text, 'chatNode');
  return { chatReply: text };
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
    return { output: await hintNode(state.input.payload, llm) };
  };

  const paraphrase = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'paraphrase') {
      throw new Error('paraphrase node invoked for non-paraphrase task');
    }
    return { output: await paraphraseNode(state.input.payload, llm) };
  };

  const classifyReflection = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'classify_reflection') {
      throw new Error('reflection node invoked for non-reflection task');
    }
    return { output: await reflectionNode(state.input.payload, llm) };
  };

  const scaffoldMC = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'scaffold_mc') {
      throw new Error('scaffold_mc node invoked for non-scaffold task');
    }
    return { output: await scaffoldMCNode(state.input.payload, llm) };
  };

  const advanceToBeat = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'advance_to_beat') {
      throw new Error('advance node invoked for non-advance task');
    }
    return { output: await advanceNode(state.input.payload, llm) };
  };

  const chat = async (
    state: AgentGraphState,
  ): Promise<Partial<AgentGraphState>> => {
    if (state.input.task !== 'chat') {
      throw new Error('chat node invoked for non-chat task');
    }
    return { output: await chatNode(state.input.payload, llm) };
  };

  return new StateGraph(AgentAnnotation)
    .addNode('hint', hint)
    .addNode('paraphrase', paraphrase)
    .addNode('classify_reflection', classifyReflection)
    .addNode('scaffold_mc', scaffoldMC)
    .addNode('advance_to_beat', advanceToBeat)
    .addNode('chat', chat)
    .addConditionalEdges(START, (state: AgentGraphState) => state.input.task, {
      hint: 'hint',
      paraphrase: 'paraphrase',
      classify_reflection: 'classify_reflection',
      scaffold_mc: 'scaffold_mc',
      advance_to_beat: 'advance_to_beat',
      chat: 'chat',
    })
    .addEdge('hint', END)
    .addEdge('paraphrase', END)
    .addEdge('classify_reflection', END)
    .addEdge('scaffold_mc', END)
    .addEdge('advance_to_beat', END)
    .addEdge('chat', END)
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
