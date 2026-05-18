/** Canonical input → output pair used as a few-shot prelude. */
export type FewShotExample = {
  /** The exact text the node would feed as the user/human message. */
  readonly input: string;
  /** The exact text the node expects the model to return. */
  readonly output: string;
};
