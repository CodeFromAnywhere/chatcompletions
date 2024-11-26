import { getCookie } from "./getCookie.js";
import { parseBasePath } from "./parseBasePath.js";
import { LlmGeneration } from "./types.js";
import { fetchWithTimeout, hashString, parseCodeBlock } from "./util.js";
import html401 from "./public/401.html";
import { getLlmGeneration } from "./getLlmGeneration.js";

const getSystemPrompt = async (context: {
  contextUrl?: string;
  contextJsonPointer?: string;
}) => {
  const { contextJsonPointer, contextUrl } = context;

  if (!contextUrl) {
    return { status: 200 };
  }

  if (!URL.canParse(contextUrl)) {
    return { status: 400, error: "Cannot parse url" };
  }

  try {
    // Fetch markdown context
    const contextResponse = await fetchWithTimeout(contextUrl, {
      timeout: 60000,
    });

    if (!contextResponse.ok) {
      return {
        error: `Failed to fetch context: ${contextResponse.statusText}`,
        status: contextResponse.status,
      };
    }

    const markdownContext = await contextResponse.text();

    const system = `${contextUrl}
${"-".repeat(80)}

${markdownContext}`;

    if (contextJsonPointer) {
      // TODO: JSON Pointer support
      // 1) parse as JSON, YAML, CSV, XML or Markdown into a JS object
      // 2) use JSON Pointer syntax to select a subset of that, if available
      // 3) convert it to the best LLM-readable datastructure
      return {
        status: 400,
        error: "Context JSON Pointers aren't supported yet",
      };
    }

    return { status: 200, system };
  } catch (e: any) {
    return { status: 500, error: e.message };
  }
};

export const base = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const context = parseBasePath(url.pathname);
  if (!context) {
    return new Response(
      "Please use the following format: /base/[llmBasePath]/model/[llmModelName]/from/[contextUrl][@jsonpointer]/prompt/[prompt]/output[@jsonpointer].[ext]",
    );
  }

  const {
    llmBasePath,
    llmModelName,
    contextUrl,
    contextJsonPointer,
    prompt,
    outputJsonPointer,
    ext,
  } = context;

  const llmApiKey =
    url.searchParams.get("llmApiKey") ||
    request.headers.get("X-LLM-Api-Key")?.slice("Bearer ".length) ||
    getCookie(request, "llmApiKey");

  const isBrowser = request.headers.get("accept")?.startsWith("text/html");

  if (
    url.searchParams.get("llmApiKey") &&
    isBrowser &&
    url.protocol === "https:"
  ) {
    // in browsers redirect with a cookie so we don't have the llmApiExposed
    const setCookieValue = [
      `llmApiKey=${encodeURIComponent(llmApiKey || "")}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Max-Age=34560000",
    ].join("; ");

    return new Response("redirecting", {
      status: 302,
      headers: {
        Location: url.origin + url.pathname,
        "Set-Cookie": setCookieValue,
      },
    });
  }

  const systemPrompt = await getSystemPrompt({
    contextUrl,
    contextJsonPointer,
  });

  const result = await getLlmGeneration(
    {
      requestUrl: url.origin + url.pathname,
      contextUrl,
      llmApiKey,
      llmBasePath,
      input: {
        model: llmModelName,
        messages: [
          systemPrompt.system
            ? { role: "system", content: systemPrompt.system }
            : undefined,
          { role: "user", content: prompt },
        ].filter((x) => !!x),
      },
    },
    env.chatcompletions,
  );

  if (!result) {
    if (isBrowser) {
      return new Response(html401, {
        status: 401,
        headers: { "Content-Type": "text/html" },
      });
    }
    return new Response("Unauthorized", { status: 401 });
  }

  // TODO: parse LLM generation into the desired output
  // based on the JSON pointer and extension.
  // Use sensible defaults.
  return new Response(JSON.stringify(result, undefined, 2), {
    headers: { "Content-Type": "application/json" },
  });
};
