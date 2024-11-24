import { parse as parseYaml, stringify as stringifyYaml } from "@std/yaml";

// Custom error class for timeout
class FetchTimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

// Type for the configuration options
interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

/**
 * Performs a fetch request that automatically aborts after a specified timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeout = 60000, ...fetchOptions } = options;
  const controller = new AbortController();
  const { signal } = controller;

  // Create a timeout promise that rejects after the specified time
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new FetchTimeoutError());
    }, timeout);

    // If the signal is aborted, clear the timeout
    signal.addEventListener("abort", () => clearTimeout(timeoutId));
  });

  try {
    // Race between the fetch and the timeout
    const response = await Promise.race([
      fetch(url, { ...fetchOptions, signal }),
      timeoutPromise,
    ]);

    return response;
  } catch (error) {
    if (error instanceof FetchTimeoutError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchTimeoutError();
    }
    throw error;
  }
}

/**
 * Hashes a string and returns alphanumeric characters (A-Z, a-z, 0-9)
 * with relatively uniform distribution
 */
export async function hashString(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Define our character set
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Map each byte to a character in our charset
  return hashArray
    .map((byte) => {
      // Use modulo to map the byte to our charset length
      const index = byte % charset.length;
      return charset[index];
    })
    .join("");
}

/**
 * Attempts to extract and parse the first code block from markdown content
 */
export function parseCodeBlock(content: string): {
  content: string;
  ext: "json" | "yaml" | "md";
} {
  // Try to find code blocks with or without language specification
  const codeBlockRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
  const matches = [...content.matchAll(codeBlockRegex)];

  if (matches.length === 0) {
    return { content, ext: "md" }; // Return full content if no code blocks found
  }

  const firstBlock = matches[0][1].trim();

  // Try parsing as JSON first
  try {
    return {
      content: JSON.stringify(JSON.parse(firstBlock), null, 2),
      ext: "json",
    };
  } catch (e) {
    // If JSON parsing fails, try YAML
    try {
      const yamlResult = parseYaml(firstBlock);
      return { content: stringifyYaml(yamlResult), ext: "yaml" };
    } catch (e) {
      // If both parsing attempts fail, return the raw code block
      return { content: firstBlock, ext: "md" };
    }
  }
}
