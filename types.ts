// TypeScript interface for the captured groups
export interface URLComponents {
  llmBasePath: string; // The base path for the LLM (required)
  llmModelName: string; // The model name (required)
  contextUrl?: string; // The context URL (optional)
  contextJsonPointer?: string; // JSON pointer for the context (optional, requires contextUrl)
  prompt: string; // The prompt string (required)
  outputType: "result" | "codeblock" | "codeblocks" | "content"; // The output type (required)
  ext: string; // The file extension (required)
}

export type ResultData = {
  result: LlmGeneration;
  outputType: string;
  ext: string;
};

/** What is cached for any LLM generation */
export type LlmGeneration = {
  requestUrl: string;
  contextUrl?: string;
  cacheUrl: string;

  llmBasePath: string;

  // input for /chat/completion endpoint
  input: ChatCompletionInput;

  // if non-200 will also be saved
  status: number;

  // output of /chat/completion endpoint (should be accumulated if stream was used)
  output?: ChatCompletionOutput & {
    codeblocks?: { data?: any; text: string; lang?: string }[];
  };
  error?: string;
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

export type FullToolCallDelta = {
  id: string;
  index: number;
  type: "function";
  function: { name: string; arguments: string };
};
export type PartialToolCallDelta = {
  type: undefined;
  id: undefined;
  index: number;
  function: { arguments: string };
};

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  system_fingerprint: string;
  service_tier?: string | null;
  /** only given if setting stream_options: {"include_usage": true} in request, only given in last stream chunk */
  usage?: null | {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  choices: {
    index: number;
    delta:
      | {
          role: string;
          content?: string | null;
          /** Important: openai has this type where arguments come later and must be augmented in order. Groq does just have the first one. Badly documented! */
          tool_calls?: (FullToolCallDelta | PartialToolCallDelta)[];

          /** Our own addition. Given when tools have been executed*/
          tools?: any[];
        }
      | {
          role: undefined;
          content: undefined;
          tool_calls: undefined;
          tools: undefined;
        };
    logprobs: null;
    finish_reason: null;
  }[];
  //extra info from different parties
  x_groq?: any;
  x_actionschema?: any;
}

// additions by me
export type ChatCompletionExtension = {
  basePath?: string;
};
export type ChatCompletionMessage = {
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: {
          url: string;
          detail?: "auto" | "low" | "high";
        };
      }>;
  role: "system" | "user" | "assistant" | "tool" | "function";
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  function_call?: {
    name: string;
    arguments: string;
  };
};
export type ChatCompletionInput = {
  messages: Array<ChatCompletionMessage>;
  model: string;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  max_tokens?: number;
  n?: number;
  presence_penalty?: number;
  response_format?: {
    type: "text" | "json_object";
  };
  seed?: number;
  stop?: string | string[];
  stream?: boolean;
  stream_options?: { include_usage?: boolean };
  temperature?: number;
  top_p?: number;
  tools?: Array<{
    type: "function";
    function: {
      description?: string;
      name: string;
      parameters?: Record<string, any>;
    };
  }>;
  tool_choice?:
    | "none"
    | "auto"
    | {
        type: "function";
        function: {
          name: string;
        };
      };
  user?: string;
};

export type ChatCompletionOutput = {
  id: string;
  choices: Array<{
    finish_reason:
      | "stop"
      | "length"
      | "tool_calls"
      | "content_filter"
      | "function_call";
    index: number;
    message: {
      content: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
      role: "assistant";
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    logprobs: {
      content: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
        top_logprobs: Array<{
          token: string;
          logprob: number;
          bytes: number[] | null;
        }>;
      }> | null;
    } | null;
  }>;
  created: number;
  model: string;
  system_fingerprint: string;
  object: "chat.completion";
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
};
