# Beautiful Simplified GET

- ✅ Endpoint `chatcompletions.com/base/api.openai.com/v1/model/gpt-4o/from/[url][/@/jsonpointer]/message/summarize+this/output.[ext]` should throw in 401 for api key if there's no cache, after which it is in a cookie.
- Create a nice JSON with popular basepaths, model names available, and where to get the API key.
- `401.html` page should have a form for all input parameters (parsed from URL) and accept privacy policy and TOS
- `base.ts` should do actual generation
- Add some grace for 429 to `/base/*`. Besides using exponential backoff, use `x-ratelimit-*` headers indicating when we can use stuff again. This makes it easier to build reliable workflows.
- When in browser, base.ts should respond directly with HTML and pull the result as a streamed response.

# Extra features

- Feature flag to automatically add URLs either to system prompt (for utf8) or to media (for images or other mediaformats the model supports)
- Ensure it also allows parsing XML in a particular way. This will be great for performance for generating code because [JSON is harder](https://aider.chat/2024/08/14/code-in-json.html)
- Support for JSON Pointers so i can do `@/codeblocks/0`
- Support for ext. If it's HTML, should return the first HTML parseable codeblock in Content-Type tex/html. It now hosts websites!

# Website

Focus on `/base/*` with some examples that can be clicked

# `POST /base`

Same as GET but JSON input.
