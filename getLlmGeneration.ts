import { LlmGeneration } from "./types.js";
import { hashString } from "./util.js";

const withoutProtocol = (url: string | undefined) =>
  !url
    ? ""
    : url.startsWith("http://")
    ? url.slice("http://".length)
    : url.startsWith("https://")
    ? url.slice("https://".length)
    : url;

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
  // Generate cache key
  const cacheKeyHash = (await hashString(JSON.stringify(input))).slice(0, 16);

  // Add proper structure. NB: different from /base url structure
  const cacheKey = `from/${withoutProtocol(contextUrl)}/base/${withoutProtocol(
    llmBasePath,
  )}/model/${input.model}/cache/${cacheKeyHash}`;

  // Try to get from cache
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

  // TODO: use LLM and store i/o
  const data = {
    cacheUrl: `https://chatcompletions.com/${cacheKey}`,
    requestUrl,
    contextUrl,
    status: 200,
    llmBasePath,
    output: {},
    input,
  } satisfies LlmGeneration;

  // Cache the raw response
  await cache.put(cacheKey, JSON.stringify(data));

  // TODO: figure out if its possible with r2. range > expiration.
  const expirationTtl =
    input.cacheExpirationTtl !== undefined
      ? input.cacheExpirationTtl
      : 86400 * 30;

  return data;
};

/**
 * Fetches markdown content from a URL and processes it with an LLM
 */
// async function processWithLLM(
//   contextConfig: ContextConfig,
//   llmConfig: LLMConfig,
//   cache: CacheNamespace,
// ): Promise<{
//   cacheKey?: string;
//   content?: string;
//   ext?: string | null;
//   error?: string;
//   status: number;
//   promptTokens?: number;
//   completionTokens?: number;
//   cacheHit?: boolean;
// }> {
//   try {
//     // Construct the full prompt with context

//     // Call LLM API if not in cache
//     const llmUrl = `${llmConfig.llmBasePath}/chat/completions`;

//     const llmResponse = await fetchWithTimeout(llmUrl, {
//       method: "POST",
//       timeout: 180000,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${llmConfig.llmApiKey}`,
//       },
//       body: JSON.stringify({
//         model: llmConfig.llmModelName,
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are a helpful assistant that provides responses based on the given context.",
//           },
//           {
//             role: "user",
//             content: fullPrompt,
//           },
//         ],
//       }),
//     });

//     if (!llmResponse.ok) {
//       return {
//         error: `LLM API call failed: ${llmResponse.statusText}`,
//         status: llmResponse.status,
//       };
//     }

//     const llmResult = await llmResponse.json();
//     const result = llmResult.choices[0].message.content;
//     const { content, ext } = parseCodeBlock(result);

//     return {
//       content,
//       cacheKey,
//       ext,
//       status: 200,
//       promptTokens: llmResult.usage?.prompt_tokens,
//       completionTokens: llmResult.usage?.completion_tokens,
//       cacheHit: false,
//     };
//   } catch (error) {
//     console.error("Error processing with LLM:", error);
//     return {
//       error: `Processing error: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`,
//       status: 500,
//     };
//   }
// }
