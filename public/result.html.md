According to the OpenAPI, make the result HTML page.

Considering you have const data = {...} provided in the beginning of the script (it will be injected) containing a `ResultData` object (see type in attachment), make a full HTML page (use cdn.tailwindcss.com) and JS, that shows the LLM Generation nicely for the website chatcompletions.com.

Ensure to add const data = undefined; at the beginning of the script

Parse the url and fill it in in a form. when editing and submitting the form, go to the new url.

Also ensure to add buttons for [Markdown](content.md?raw=true) [Codeblock](codeblock.json?raw=true) [JSON](result.json?raw=true) [YAML](result.yaml?raw=true)

```
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

```
