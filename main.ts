import { createChatCompletion } from "./createChatCompletion.js";
import { simple } from "./simple.js";
import { CacheNamespace, CacheType, Env } from "./types.js";
import { fetchWithTimeout, hashString, parseCodeBlock } from "./util.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle OPTIONS for CORS

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

      if (request.method === "GET" && url.pathname === "/chat/simple") {
        return simple(request, env);
      }

      if (url.pathname.startsWith("/cache/")) {
        const [_, __, chunk] = url.pathname.split("/");
        const [cacheKey, ext] = chunk.split(".");

        // Try to get from cache
        const result = await env.cache.get<CacheType>(cacheKey, {
          type: "json",
        });

        if (!result) {
          return new Response("Not found", { status: 404 });
        }

        if (result.ext !== ext) {
          return new Response("Not found", { status: 404 });
        }

        const contentTypes = {
          json: "application/json",
          yaml: "text/yaml",
          md: "text/markdown",
        };

        const headers: { [key: string]: string } = {
          "Content-Type":
            contentTypes[ext as keyof typeof contentTypes] || "text-markdown",
          "Access-Control-Allow-Origin": "*",
          "X-Cache-Hit": "true",
        };

        if (result.promptTokens) {
          headers["X-Prompt-Tokens"] = result.promptTokens.toString();
        }
        if (result.completionTokens) {
          headers["X-Completion-Tokens"] = result.completionTokens.toString();
        }

        return new Response(result.content, { headers });
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
