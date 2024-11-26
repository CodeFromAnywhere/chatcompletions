import { createChatCompletion } from "./createChatCompletion.js";
import { base } from "./base.js";
import { LlmGeneration, Env } from "./types.js";

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

      if (request.method === "GET" && url.pathname.startsWith("/base/")) {
        return base(request, env);
      }

      if (url.pathname.startsWith("/cache/")) {
        const [_, __, chunk] = url.pathname.split("/");
        const [cacheKey, ext] = chunk.split(".");

        // Try to get from cache
        const result = await env.cache.get<LlmGeneration>(cacheKey, {
          type: "json",
        });

        if (!result) {
          return new Response("Not found", { status: 404 });
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
