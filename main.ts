import { createChatCompletion } from "./createChatCompletion.js";
import { base, outputResult, parseBasePath } from "./base.js";
import { LlmGeneration } from "./types.js";
import { calculateCost } from "./calculate-cost.js";

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      const url = new URL(request.url);

      if (request.method === "POST" && url.pathname === "/chat/completions") {
        return createChatCompletion(request, env);
      }

      if (request.method === "GET" && url.pathname === "/calculate-cost") {
        const cost = calculateCost(
          Object.fromEntries(new URL(request.url).searchParams as any) as any,
        );
        return new Response(
          JSON.stringify(cost || { error: "Invalid params" }, undefined, 2),
          { status: cost ? 200 : 400 },
        );
      }

      if (request.method === "GET" && url.pathname?.startsWith("/cache/")) {
        const [, , cacheKey, outputTypeAndExt] = url.pathname.split("/");
        const [outputType, ext] = outputTypeAndExt.split(".");

        const isBrowser =
          request.headers.get("accept")?.startsWith("text/html") || false;
        const isRaw = url.searchParams.get("raw") === "true";

        // Try to get from cache
        const result = await env.chatcompletions.get(cacheKey);

        if (!result) {
          return new Response(
            "Cached resource not found. Please use the following format: /from/[contextUrl][@jsonpointer]/base/[llmBasePath]/model/[llmModelName]/cache/[cacheKey]",
            { status: 404 },
          );
        }

        const json = await result.json<LlmGeneration>();

        return outputResult(json, ext, outputType, isBrowser, isRaw);
      }

      const context = parseBasePath(url.pathname);

      if (request.method === "GET" && context) {
        return base(request, env);
      }

      return new Response("Method not allowed", { status: 400 });
    } catch (e) {
      console.error(e);
      return new Response("Internal Server Error", {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
