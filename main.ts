import { createChatCompletion } from "./createChatCompletion.js";
import { base } from "./base.js";
import { LlmGeneration, Env } from "./types.js";
import { parseBasePath } from "./parseBasePath.js";

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

      const baseParse = parseBasePath(url.pathname);
      if (
        request.method === "GET" &&
        url.pathname.startsWith("/base/") &&
        baseParse
      ) {
        return base(request, env);
      }

      if (request.method === "GET" && url.pathname.startsWith("/base/")) {
        const cacheKey = url.pathname.slice(1);

        // Try to get from cache
        const result = await env.cache.get<LlmGeneration>(cacheKey, {
          type: "json",
        });

        if (!result) {
          return new Response(
            "Please use the following format: /base/[llmBasePath]/model/[llmModelName]/from/[contextUrl][@jsonpointer]/prompt/[prompt]/output[@jsonpointer].[ext]",
          );
        }

        const headers: { [key: string]: string } = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Cache-Hit": "true",
        };

        return new Response(JSON.stringify(result, undefined, 2), { headers });
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
