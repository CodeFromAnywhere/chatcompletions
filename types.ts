export type ChatCompletionStandardInput = {
  messages: { role: string; content: string }[];
  model: string;
};
export type ChatCompletionExtraInput = {
  /**
   * Expiry time in seconds for cache.
   *
   * Customise cache expiration. Defaults to 1 month
   *
   * You will be charged for this accordingly
   */
  cacheExpirationTtl?: number;
};

/** What is cached for any LLM generation */
export type LlmGeneration = {
  requestUrl: string;
  contextUrl?: string;
  cacheUrl: string;

  llmBasePath: string;

  // input for /chat/completion endpoint
  input: ChatCompletionStandardInput & ChatCompletionExtraInput;

  // if non-200 will also be saved
  status: number;

  // output of /chat/completion endpoint (should be accumulated if stream was used)
  output: any;
};
/**
 * Usage statistics for the completion request.
 */
export interface Usage {
  /**
   * Number of tokens in the generated completion.
   */
  completion_tokens: number;
  /**
   * Number of tokens in the prompt.
   */
  prompt_tokens: number;
  /**
   * Total number of tokens used in the request (prompt + completion).
   */
  total_tokens: number;
}
