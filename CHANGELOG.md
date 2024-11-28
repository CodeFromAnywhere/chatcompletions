## Beautiful Simplified GET - Monday, 25th of November, 2024

- ✅ Endpoint `chatcompletions.com/base/api.openai.com/v1/model/gpt-4o/from/[url][/@/jsonpointer]/message/summarize+this/output.[ext]` should throw in 401 for api key if there's no cache, after which it is in a cookie.
- ✅ Have a more structured cache that allows for range retrieval and make it retrievable on exact match basis
- ✅ Use R2 to allow for range queries later
- ✅ Create a models-JSON with popular basepaths, model names available, and where to get the API key.
- ✅ `401.html` page should have a form for all input parameters (parsed from URL) and accept privacy policy and TOS
- ✅ Normalize parser to use similar structure as cache so it's easier to interchange.
- ✅ Finish `getLlmGeneration`
- ✅ parse LLM generation into codeblocks
- ✅ Ensure it also allows parsing XML in a particular way. This will be great for performance for generating code because [JSON is harder](https://aider.chat/2024/08/14/code-in-json.html)
- ✅ Support for ext. If it's HTML, should return the first HTML parseable codeblock in Content-Type tex/html. It now hosts websites!
