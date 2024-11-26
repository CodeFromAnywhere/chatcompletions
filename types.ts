export interface CacheNamespace {
  get: <T>(key: string, config?: any) => Promise<T>;
  put: (key: string, value: any, config?: any) => Promise<void>;
}

export type Env = { cache: CacheNamespace; MASTER_SECRET: string };

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
  cacheBasePath: string;

  llmBasePath: string;
  // input for /chat/completion endpoint
  input: ChatCompletionStandardInput & ChatCompletionExtraInput;

  // if non-200 will also be saved
  status: number;

  // output of /chat/completion endpoint (should be accumulated if stream was used)
  output: any;
};
