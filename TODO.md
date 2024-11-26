# Meaningful Accessible File Transformations for All

This has been my high-level goal all along, and a good base for using transformers in the cloud is at the core of it.

Make any LLM simple, graceful, stable, scalable, cacheable, monetizable, debuggable.

Debugable: IO is available at the URL, so if you're making a pipeline each step can easily be made verifyable.

## Beautiful Simplified GET

- ✅ Endpoint `chatcompletions.com/base/api.openai.com/v1/model/gpt-4o/from/[url][/@/jsonpointer]/message/summarize+this/output.[ext]` should throw in 401 for api key if there's no cache, after which it is in a cookie.
- ✅ Have a more structured cache that allows for range retrieval and make it retrievable on exact match basis
- ✅ Use R2 to allow for range queries later
- ✅ Create a models-JSON with popular basepaths, model names available, and where to get the API key.
- ✅ `401.html` page should have a form for all input parameters (parsed from URL) and accept privacy policy and TOS
- Normalize parser to use similar structure as cache so it's easier to interchange.
- `base.ts` should do actual generation
- When in browser, base.ts should respond directly with HTML and pull the result as a streamed response. All parameters should be editable. From here you can get the raw by just passing `?accept`
- Add some grace for 429 to `/base/*`. Besides using exponential backoff, use `x-ratelimit-*` headers indicating when we can use stuff again. This makes it easier to build reliable workflows.
- If it breaks after multiple attempts, add logic to create a queue so it gets done at some point.
- Avoid having improper encoding from context
- Fall back to llmtext.com if response is in HTML
- Add parameter `?raw=true` for contextUrl to prevent falling back to `llmtext.com/*` if response is HTML
- Ensure I add an API Key for Jina for llmtext.com so this actually works well.

## ACIDly Avoid multiple generations

Immediately insert a KV key for any visited URL that ensures any other calls to the same URL enter a waiting pattern for the same generation to be done. Ensure this is as ACID as possible on Cloudflare. Upstash Redis is maybe best. If I can be 100% sure that there's only 1 generation, it will be a lot better. This pattern would be great EVERYWHERE.

## Queue

QStash queue as a fallback when it fails is great to ensure quickest possible delivery and most reliable at the same time.

## Website

Focus on `/base/*` with some examples that can be clicked

On claudeflair, add proxy to https://chatcompletions.com that is just https://claudeflair.com/from/{url}/prompt/{prompt} (model and basepath pre-filled)

## `POST /base`

Same as GET but JSON input.

## Extra features

- Allow for contextApiKey that gets removed from cache and, if used, cache isn't accessible without it being provided again. Otherwise we get apiKeys from uithub in the URL etc. Don't want that.
- Feature flag to automatically add URLs either to system prompt (for utf8) or to media (for images or other mediaformats the model supports)
- Ensure it also allows parsing XML in a particular way. This will be great for performance for generating code because [JSON is harder](https://aider.chat/2024/08/14/code-in-json.html)
- Support for JSON Pointers so i can do `@/codeblocks/0`
- Support for ext. If it's HTML, should return the first HTML parseable codeblock in Content-Type tex/html. It now hosts websites!
