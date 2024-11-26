import { createChatCompletion } from "./createChatCompletion.js";
import { base } from "./base.js";
import { LlmGeneration } from "./types.js";
import { parseBasePath } from "./parseBasePath.js";
import { calculateCost } from "./calculate-cost.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

      if (request.method === "GET" && url.pathname.startsWith("/base/")) {
        return base(request, env);
      }

      if (request.method === "GET" && url.pathname.startsWith("/from/")) {
        const cacheKey = url.pathname.slice(1);

        // Try to get from cache
        const result = await env.chatcompletions.get(cacheKey);

        if (!result) {
          return new Response(
            "Please use the following format: /from/[contextUrl][@jsonpointer]/base/[llmBasePath]/model/[llmModelName]/cache/[cacheKey]",
          );
        }

        const json = await result.json<LlmGeneration>();

        const headers: { [key: string]: string } = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Cache-Hit": "true",
        };

        return new Response(JSON.stringify(json, undefined, 2), { headers });
      }

      return new Response("Not found", { status: 404 });
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
