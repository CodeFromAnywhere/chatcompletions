// The regex pattern that matches URLs of the format:
// /base/[llmBasePath]/model/[llmModelName]/from/[contextUrl][@jsonpointer]/prompt/[prompt]/output[@jsonpointer].[ext]
// where the from/contextUrl part is optional and both contextUrl and output can have optional JSON pointers
const urlPattern =
  /^\/base\/([^\/]+)\/model\/([^\/]+)(?:\/from\/([^@]+)(?:@(\/[^\/]+(?:\/[^\/]+)*))?)?\/prompt\/([^\/]+)\/output(?:@(\/[^\/]+(?:\/[^\/]+)*))?\.([^\/]+)$/;

// TypeScript interface for the captured groups
interface URLComponents {
  llmBasePath: string; // The base path for the LLM (required)
  llmModelName: string; // The model name (required)
  contextUrl?: string; // The context URL (optional)
  contextJsonPointer?: string; // JSON pointer for the context (optional, requires contextUrl)
  prompt: string; // The prompt string (required)
  outputJsonPointer?: string; // JSON pointer for the output (optional)
  ext: string; // The file extension (required)
}

/**
 * Parses a URL string into its components according to the specified pattern.
 *
 * @param url - The URL string to parse
 * @returns URLComponents object if the URL matches the pattern, null otherwise
 *
 * @example
 * // Basic usage without context or JSON pointers
 * parseURL('/base/anthropic/model/claude2/prompt/simple/output.txt')
 * // → { llmBasePath: 'anthropic', llmModelName: 'claude2', prompt: 'simple', ext: 'txt' }
 *
 * // With context URL and its JSON pointer
 * parseURL('/base/openai/model/gpt4/from/context@/path/to/data/prompt/test/output.json')
 * // → { llmBasePath: 'openai', llmModelName: 'gpt4', contextUrl: 'context',
 * //     contextJsonPointer: '/path/to/data', prompt: 'test', ext: 'json' }
 *
 * // With output JSON pointer
 * parseURL('/base/openai/model/gpt4/prompt/test/output@/response/field.json')
 * // → { llmBasePath: 'openai', llmModelName: 'gpt4', prompt: 'test',
 * //     outputJsonPointer: '/response/field', ext: 'json' }
 */
export function parseBasePath(pathname: string): URLComponents | null {
  const match = pathname.match(urlPattern);

  if (!match) return null;

  const [
    ,
    llmBasePath,
    llmModelName,
    contextUrl,
    contextJsonPointer,
    prompt,
    outputJsonPointer,
    ext,
  ] = match;

  return {
    llmBasePath,
    llmModelName,
    ...(contextUrl && { contextUrl }),
    ...(contextJsonPointer && { contextJsonPointer }),
    prompt,
    ...(outputJsonPointer && { outputJsonPointer }),
    ext,
  };
}

// Explanation of regex components:
// ^                                    Start of string
// \/base\/                            Matches "/base/"
// ([^\/]+)                            Captures llmBasePath (anything except /)
// \/model\/                           Matches "/model/"
// ([^\/]+)                            Captures llmModelName (anything except /)
// (?:                                 Start non-capturing group for optional from/context part
//   \/from\/                          Matches "/from/"
//   ([^@]+)                           Captures contextUrl (anything except @)
//   (?:@(\/[^\/]+(?:\/[^\/]+)*))?    Optionally captures contextJsonPointer (nested paths)
// )?                                  End optional from/context group
// \/prompt\/                          Matches "/prompt/"
// ([^\/]+)                            Captures prompt (anything except /)
// \/output                            Matches "/output"
// (?:@(\/[^\/]+(?:\/[^\/]+)*))?      Optionally captures outputJsonPointer (nested paths)
// \.                                  Matches literal dot
// ([^\/]+)                            Captures ext (anything except /)
// $                                   End of string
