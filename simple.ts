import { CacheNamespace, CacheType, Env } from "./types.js";
import { fetchWithTimeout, hashString, parseCodeBlock } from "./util.js";

interface LLMConfig {
  llmBasePath: string;
  llmModelName: string;
  llmApiKey: string;
}

interface ContextConfig {
  contextUrl: string;
  prompt: string;
}

/**
 * Fetches markdown content from a URL and processes it with an LLM
 */
async function processWithLLM(
  contextConfig: ContextConfig,
  llmConfig: LLMConfig,
  cache: CacheNamespace,
): Promise<{
  cacheKey?: string;
  content?: string;
  ext?: string | null;
  error?: string;
  status: number;
  promptTokens?: number;
  completionTokens?: number;
  cacheHit?: boolean;
}> {
  try {
    // Fetch markdown context
    const contextResponse = await fetchWithTimeout(contextConfig.contextUrl, {
      timeout: 60000,
    });

    if (!contextResponse.ok) {
      return {
        error: `Failed to fetch context: ${contextResponse.statusText}`,
        status: contextResponse.status,
      };
    }

    const markdownContext = await contextResponse.text();

    // Construct the full prompt with context
    const fullPrompt = `Here is some context in markdown format:
  
  ${markdownContext}
  
  User prompt:
  ${contextConfig.prompt}`;

    // Generate cache key
    const cacheKey = (
      await hashString(
        `${llmConfig.llmModelName}-${llmConfig.llmBasePath}-${fullPrompt}`,
      )
    ).slice(0, 16);

    // Try to get from cache
    const cachedResult = await cache.get<CacheType>(cacheKey, { type: "json" });

    if (cachedResult) {
      const { content, ext } = parseCodeBlock(cachedResult.content);
      return {
        content,
        ext,
        status: 200,
        promptTokens: cachedResult.promptTokens,
        completionTokens: cachedResult.completionTokens,
        cacheHit: true,
        cacheKey,
      };
    }

    // Call LLM API if not in cache
    const llmUrl = `${llmConfig.llmBasePath}/chat/completions`;

    const llmResponse = await fetchWithTimeout(llmUrl, {
      method: "POST",
      timeout: 180000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmConfig.llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.llmModelName,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides responses based on the given context.",
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
      }),
    });

    if (!llmResponse.ok) {
      return {
        error: `LLM API call failed: ${llmResponse.statusText}`,
        status: llmResponse.status,
      };
    }

    const llmResult = await llmResponse.json();
    const result = llmResult.choices[0].message.content;
    const { content, ext } = parseCodeBlock(result);

    // Cache the raw response
    await cache.put(
      cacheKey,
      JSON.stringify({
        content,
        ext,
        promptTokens: llmResult.usage?.prompt_tokens,
        completionTokens: llmResult.usage?.completion_tokens,
      } satisfies CacheType),
      // Cache for up to a month
      { expirationTtl: 86400 * 30 },
    );

    return {
      content,
      cacheKey,
      ext,
      status: 200,
      promptTokens: llmResult.usage?.prompt_tokens,
      completionTokens: llmResult.usage?.completion_tokens,
      cacheHit: false,
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

export const simple = async (request: Request, env: Env) => {
  const url = new URL(request.url);

  // Get required parameters
  const contextUrl = url.searchParams.get("contextUrl");
  const prompt = url.searchParams.get("prompt");
  const llmBasePath = url.searchParams.get("llmBasePath");
  const llmModelName = url.searchParams.get("llmModelName");
  const llmApiKey = url.searchParams.get("llmApiKey");

  // Validate required parameters
  if (!contextUrl || !prompt || !llmBasePath || !llmModelName || !llmApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const result = await processWithLLM(
    { contextUrl, prompt },
    { llmBasePath, llmModelName, llmApiKey },
    env.cache,
  );

  if (result.error) {
    return new Response(result.error, { status: result.status });
  }

  const redirectUrl = url.origin + "/" + result.cacheKey + "." + result.ext;
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    Url: redirectUrl,
  };

  if (request.headers.get("accept")?.includes("text/html")) {
    // in browser, redirect
    return new Response("Redirecting", {
      status: 302,
      headers: { Location: redirectUrl },
    });
  }

  if (result.promptTokens) {
    headers["X-Prompt-Tokens"] = result.promptTokens.toString();
  }
  if (result.completionTokens) {
    headers["X-Completion-Tokens"] = result.completionTokens.toString();
  }
  if (result.cacheHit !== undefined) {
    headers["X-Cache-Hit"] = result.cacheHit.toString();
  }

  return new Response(result.content, {
    status: result.status,
    headers,
  });
};
