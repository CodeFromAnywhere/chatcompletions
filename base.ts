import { getCookie } from "./getCookie.js";
import {
  ChatCompletionMessage,
  LlmGeneration,
  ResultData,
  URLComponents,
} from "./types.js";
import { fetchWithTimeout } from "./util.js";
import html401 from "./public/401.html";
import htmlGrid from "./public/data-grid.html";
import resultHtml from "./public/result.html";
import { getLlmGeneration } from "./getLlmGeneration.js";
import { findAndParseCodeblocks, stringifyData } from "./parseCodeblocks.js";
import { stringify as yamlStringify } from "@std/yaml";
import { injectOGImage } from "./injectOGImage.js";

export const escapeHTML = (str: string) => {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .replace(
      /[&<>'"]/g,
      (tag: string) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
        }[tag] || tag),
    )
    .replace(/\u0000/g, "\uFFFD") // Replace null bytes
    .replace(/\u2028/g, "\\u2028") // Line separator
    .replace(/\u2029/g, "\\u2029"); // Paragraph separator
};

// The regex pattern that matches URLs of the format:
// /from/[contextUrl][@jsonpointer]/base/[llmBasePath]/model/[llmModelName]/prompt/[prompt]/[outputType].[ext]
// where the from/contextUrl part is optional and contextUrl can have optional JSON pointers
const urlPattern =
  /^(?:\/from\/([^@]+)(?:@(\/[^\/]+(?:\/[^\/]+)*))?)?\/base\/([^\/]+)\/model\/([^\/]+)\/prompt\/([^\/]+)\/(result|codeblock|codeblocks|content)\.([^\/]+)$/;

const prependProtocol = (maybeFullUrl: string) => {
  if (maybeFullUrl.startsWith("http://")) {
    return maybeFullUrl;
  }
  if (maybeFullUrl.startsWith("https://")) {
    return maybeFullUrl;
  }
  return "https://" + maybeFullUrl;
};

/**
 * Parses a URL string into its components according to the specified pattern.
 *
 * @param url - The URL string to parse
 * @returns URLComponents object if the URL matches the pattern, null otherwise
 *
 * @example
 * // Basic usage without context
 * parseURL('/base/anthropic/model/claude2/prompt/simple/output.txt')
 * // → { llmBasePath: 'anthropic', llmModelName: 'claude2', prompt: 'simple', outputType: OutputType.OUTPUT, ext: 'txt' }
 *
 * // With context URL and its JSON pointer
 * parseURL('/from/context@/path/to/data/base/openai/model/gpt4/prompt/test/codeblock.json')
 * // → { llmBasePath: 'openai', llmModelName: 'gpt4', contextUrl: 'context',
 * //     contextJsonPointer: '/path/to/data', prompt: 'test', outputType: OutputType.CODEBLOCK, ext: 'json' }
 */
export function parseBasePath(pathname: string): URLComponents | null {
  const match = pathname.match(urlPattern);

  if (!match) return null;

  const [
    ,
    contextUrl,
    contextJsonPointer,
    llmBasePath,
    llmModelName,
    prompt,
    outputType,
    ext,
  ] = match;

  return {
    ...(contextUrl && {
      contextUrl:
        contextUrl === "none"
          ? "none"
          : prependProtocol(decodeURIComponent(contextUrl)),
    }),
    ...(contextJsonPointer && { contextJsonPointer }),
    llmBasePath: prependProtocol(decodeURIComponent(llmBasePath)),
    llmModelName,
    prompt: decodeURIComponent(prompt),
    outputType: outputType as URLComponents["outputType"],
    ext,
  };
}

const getSystemPrompt = async (
  context: {
    contextUrl?: string;
    contextJsonPointer?: string;
  },
  env: Env,
) => {
  const { contextJsonPointer, contextUrl } = context;

  console.log({ contextUrl, contextJsonPointer });
  if (!contextUrl || contextUrl === "none") {
    return { status: 200 };
  }

  if (!URL.canParse(contextUrl)) {
    return { status: 400, error: "Cannot parse url" };
  }

  if (contextUrl.startsWith("https://chatcompletions.com")) {
    // NEEDED BECAUSE STUPID CLAUDFLAIR TRYING TO BLOCK ME FOR SECURITY REASONS. NEED TO CALL INTERNALLY
    console.log("Doing A Loopy Thing!");
    const response = await base(
      new Request(contextUrl, { method: "GET" }),
      env,
    );
    if (!response.ok) {
      return { status: 400, error: "Couldn't get my own context" };
    }
    const c: string = await response.text();

    return { status: 200, system: c };
  }

  try {
    // Fetch markdown context
    const contextResponse = await fetchWithTimeout(contextUrl, {
      timeout: 60000,
    });

    if (!contextResponse.ok) {
      return {
        error: `Failed to fetch context: ${
          contextResponse.statusText
        }; ${await contextResponse.text()}`,
        status: contextResponse.status,
      };
    }

    const contentType = contextResponse.headers.get("content-type");
    const markdownContext = await contextResponse.text();

    if (
      contentType?.startsWith("text/html") &&
      markdownContext.length >= 50000
    ) {
      return {
        status: 400,
        error: "Context was HTML file that was too large (max 50kb)",
      };
    }

    const system = markdownContext;

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
  if (!context?.contextUrl) {
    return new Response(
      "Please use the following format: /from/[contextUrl][@jsonpointer]/base/[llmBasePath]/model/[llmModelName]/prompt/[prompt]/result.[ext]",
      { status: 400 },
    );
  }

  const {
    llmBasePath,
    llmModelName,
    contextUrl,
    contextJsonPointer,
    prompt,
    outputType,
    ext,
  } = context;

  const llmApiKey =
    url.searchParams.get("llmApiKey") ||
    request.headers.get("X-LLM-Api-Key")?.slice("Bearer ".length) ||
    getCookie(request, "llmApiKey");

  const isBrowser =
    request.headers.get("accept")?.startsWith("text/html") || false;
  const isRaw = url.searchParams.get("raw") === "true";

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

  const systemPrompt = await getSystemPrompt(
    {
      contextUrl,
      contextJsonPointer,
    },
    env,
  );

  if (systemPrompt.status !== 200) {
    return new Response(systemPrompt.error, { status: systemPrompt.status });
  }

  console.log({ systemPrompt });
  const messages = [
    {
      role: "system",
      content: systemPrompt.system || "You are a helpful assistant",
    } satisfies ChatCompletionMessage,
    { role: "user", content: prompt } satisfies ChatCompletionMessage,
  ];

  console.log({ messages });

  const result = await getLlmGeneration(
    {
      requestUrl: url.origin + url.pathname,
      contextUrl,
      llmApiKey,
      llmBasePath,
      input: {
        model: llmModelName,
        messages,
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

  return outputResult(request.url, result, ext, outputType, isBrowser, isRaw);
};

export const outputResult = (
  requestUrl: string,
  result: LlmGeneration,
  ext: string,
  outputType: URLComponents["outputType"],
  isBrowser: boolean,
  isRaw: boolean,
) => {
  if (!result.output) {
    return new Response(result.error, { status: result.status });
  }

  const markdownString = result.output.choices?.[0]?.message?.content;

  if (!markdownString) {
    return new Response("No output content", { status: 500 });
  }

  // parse LLM generation into codeblocks
  const codeblocks = findAndParseCodeblocks(markdownString);

  // add codeblocks to output
  result.output.codeblocks = codeblocks;

  // based on the JSON pointer and extension, get the desired output
  const contentTypes = {
    html: "text/html",
    json: "application/json",
    md: "text/markdown",
    mdx: "text/markdown",
    yaml: "text/yaml",
    ts: "text/plain",
    js: "text/javascript",
    css: "text/css",
    xml: "text/xml",
    svg: "image/svg+xml",
    txt: "text/plain",
    csv: "text/csv",
    jsx: "text/javascript",
    tsx: "text/plain",
    php: "text/php",
    py: "text/x-python",
    rb: "text/ruby",
    java: "text/x-java-source",
    go: "text/x-go",
    rs: "text/rust",
    toml: "text/toml",
    tex: "text/x-tex",
    sh: "text/x-sh",
    bash: "text/x-sh",
    bat: "text/x-bat",
    ps1: "text/x-powershell",
    sql: "text/x-sql",
    r: "text/x-r",
    lua: "text/x-lua",
    nim: "text/x-nim",
    dart: "text/x-dart",
    kt: "text/x-kotlin",
    swift: "text/x-swift",
    scala: "text/x-scala",
    perl: "text/x-perl",
    elm: "text/x-elm",
  };

  const contentType = ext
    ? contentTypes[ext as keyof typeof contentTypes] || "text/plain"
    : "text/plain";

  if (isBrowser && !isRaw && outputType !== "codeblock") {
    // show the entire result in the browser in a HTML view
    // easy to navigate to content/codeblock/codeblocks
    return new Response(
      resultHtml.replace(
        "const data = undefined;",
        `const data = ${escapeHTML(
          JSON.stringify({
            result,
            outputType,
            ext,
          } satisfies ResultData),
        )};`,
      ),
      { headers: { "Content-Type": "text/html" } },
    );
  }

  if (outputType === "result") {
    // entire input+output cache object
    // can be in json, or yaml
    if (ext === "yaml") {
      return new Response(yamlStringify(result), {
        headers: { "Content-Type": "text/yaml" },
      });
    }
    if (ext === "json") {
      return new Response(JSON.stringify(result, undefined, 2), {
        headers: { "Content-Type": "application/json; charset=utf8" },
      });
    }
    return new Response(
      "Invalid extension. For entire result, only json or yaml are allowed",
      { status: 400 },
    );
  }

  if (outputType === "content") {
    const content = result.output.choices?.[0].message.content;

    if (!content) {
      return new Response("No content found in the response", { status: 404 });
    }

    // Just md would work
    if (ext === "md") {
      return new Response(content, {
        headers: { "Content-Type": "text/markdown; charset=utf8" },
      });
    }

    return new Response("Invalid extension. For content, use content.md", {
      status: 400,
    });
  }

  if (outputType === "codeblock") {
    // just the string
    const firstBestCodeblock = codeblocks[0];
    if (!firstBestCodeblock) {
      return new Response("No codeblock found in the response", {
        status: 404,
      });
    }

    if (!firstBestCodeblock.text) {
      return new Response(
        firstBestCodeblock.error || "Couldn't find text of first codeblock",
        { status: 404 },
      );
    }

    // Either return the data in the contenttype requested, or return in the content type of the codeblock, if it isn't data.

    const dataString = stringifyData(firstBestCodeblock.data, ext);

    if (dataString) {
      if (
        Array.isArray(firstBestCodeblock.data) &&
        firstBestCodeblock.data[0] &&
        Object.keys(firstBestCodeblock.data[0]).length &&
        !isRaw &&
        isBrowser
      ) {
        // in browser we still wanna show a grid in this case
        return new Response(
          htmlGrid.replace(
            "const data = undefined;",
            `const data = ${JSON.stringify({
              rowData: firstBestCodeblock.data,
              columnDefs: Object.keys(firstBestCodeblock.data[0]).map(
                (key) => ({ field: key }),
              ),
            })};`,
          ),
          { headers: { "Content-Type": "text/html" } },
        );
      }

      return new Response(dataString, {
        headers: { "Content-Type": contentType + "; charset=utf8" },
      });
    }

    if (firstBestCodeblock.lang === "html") {
      const text = injectOGImage(firstBestCodeblock.text, requestUrl);

      return new Response(text, {
        headers: {
          "Content-Type": "text/html; charset=utf8",
        },
      });
    }

    // NB: can be wrong ext here.

    return new Response(firstBestCodeblock.text, {
      headers: {
        "Content-Type":
          (contentTypes[firstBestCodeblock.lang as keyof typeof contentTypes] ||
            "text/plain") + "; charset=utf8",
      },
    });
  }

  if (outputType === "codeblocks") {
    // .json / .yaml (string[]) or .md (string)
    if (ext === "json") {
      return new Response(JSON.stringify(codeblocks, undefined, 2), {
        headers: { "Content-Type": "application/json; charset=utf8" },
      });
    }
    if (ext === "yaml") {
      return new Response(yamlStringify(codeblocks), {
        headers: { "Content-Type": "text/yaml; charset=utf8" },
      });
    }

    if (ext === "md") {
      return new Response(
        codeblocks
          .map((item) => `\`\`\`${item.lang || ""}\n${item.text}\n\`\`\`\n`)
          .join("\n\n"),
        {
          headers: { "Content-Type": "text/markdown; charset=utf8" },
        },
      );
    }

    return new Response(
      "Invalid extension. For codeblocks, use .json, .yaml, or .md",
      { status: 400 },
    );
  }

  return new Response("Invalid output-type", { status: 400 });
};
