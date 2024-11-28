import { ChatCompletionInput, ChatCompletionOutput } from "./types.js";
import { LlmGeneration } from "./types.js";
import { fetchWithTimeout, hashString } from "./util.js";

/** 
 General purpose LLM generation function that: 
 - returns both input and output
 - uses cache if possible
 - if no cache, requires api key
 - retry intelligently on 429 or other
 - supports stream (needs controller)
*/
export const getLlmGeneration = async (
  context: {
    requestUrl: string;
    contextUrl?: string;
    llmBasePath: string;
    llmApiKey?: string;
    input: LlmGeneration["input"];
    /** TODO: For stream */
    controller?: any;
  },
  cache: Env["chatcompletions"],
): Promise<LlmGeneration | undefined> => {
  const { llmBasePath, llmApiKey, input, contextUrl, requestUrl } = context;
  // 1) Try to get from cache

  const cacheKey = (await hashString(JSON.stringify(input))).slice(0, 16);
  // const cacheKey = `from/${withoutProtocol(contextUrl)}/base/${withoutProtocol(
  //   llmBasePath,
  // )}/model/${input.model}/cache/${cacheKeyHash}`;
  const cachedResult = await cache.get(cacheKey);

  if (cachedResult) {
    const json = await cachedResult.json<LlmGeneration>();
    if (json.status === 200) {
      return json;
    }
  }

  if (!llmApiKey) {
    return;
  }

  const output = await gracefulChatCompletion(llmBasePath, llmApiKey, input);
  const cacheUrl = `https://chatcompletions.com/cache/${cacheKey}/content.md`;

  if (!output.result) {
    return {
      error: output.error,
      status: output.status,
      input,
      requestUrl,
      contextUrl,
      llmBasePath,
      cacheUrl,
    };
  }

  const data = {
    cacheUrl,
    requestUrl,
    contextUrl,
    status: 200,
    llmBasePath,
    output: output.result,
    input,
  } satisfies LlmGeneration;

  // Cache the raw response
  await cache.put(cacheKey, JSON.stringify(data));

  return data;
};

/**
 * Fetches markdown content from a URL and processes it with an LLM
 */
async function gracefulChatCompletion(
  llmBasePath: string,

  llmApiKey: string,
  input: ChatCompletionInput,
): Promise<{ status: number; error?: string; result?: ChatCompletionOutput }> {
  try {
    // Construct the full prompt with context

    // Call LLM API if not in cache
    const llmUrl = `${llmBasePath}/chat/completions`;

    const llmResponse = await fetchWithTimeout(llmUrl, {
      method: "POST",
      timeout: 180000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify(input),
    });

    if (!llmResponse.ok) {
      return {
        error: `LLM API call failed: ${
          llmResponse.statusText
        }; \n\n ${await llmResponse.text()}`,
        status: llmResponse.status,
      };
    }

    const result: ChatCompletionOutput = await llmResponse.json();

    return {
      status: 200,
      result,
    };
  } catch (error) {
    console.error("Error processing with LLM:", error);
    return {
      error: `Processing error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      status: 500,
    };
  }
}
