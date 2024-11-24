# Requirements

- Very efficient and performant cache for LLMs
- Easy to remove parts of cache while keeping some generations for very long
- Parses codeblocks
- Handle 429s gracefully (exponential backoff)

# TODO

I now have a nice layer that caches any LLM with URL context in a nice way.

I need a good monetisable LLM setup once and for all:

- clone https://github.com/CodeFromAnywhere/tool-agent
- clone https://github.com/CodeFromAnywhere/openapi-chat-completion
- review it all and make something cool of what I need. make it open source so others can use it too for a user+paywall on cloudflare

Requirements

- Basically allow adding paywall to any LLM
- Cache LLM result and serve it under the key as well. key adds extension for clarity (.json, .yaml, .html, .md, etc)
- 401 and 402 errors given properly

#

Using npmjz.com as a base, this domain could be used to calculate AI-based statistics in realtime for any repo and cache that.

This can be useful as a base context for answering questions about code.

Example potential url structure:

- https://githus.com/CodeFromAnywhere/openapi-search (for general stats)
- https://githus.com/CodeFromAnywhere/openapi-search/q/what+does+this+repo+do (for asking any query)

In any way, AI-based github statistics are useful and should be cached globally to avoid recalculating things with LLM.

# uithub.analytics

Make 'uithub.analytics' using `getrelevantcode.ts` and claude and its README! must be quite doable.

After it works, we need an answer with `{ plan:string; extraContextNeeded:string; confidence:number; needsCodeChanges:boolean; answer: string; }` based on the relevant code.

I don't want to put the md to JSON step in this api because it would have a badly documented datastructure. Instead, we can wrap the API with another worker that has specifically this api.

The result thereof needs to be shown in the uithub-result-header (make it bigger), but only if localStorage contains `beta:true`

This also needs `cacheOnly`

This result also needs to be shown at `threads.html` on uithub (cache only)

<!-- Goal is not going to prod with this. goal is to test myself -->

# TODO

- use getrelevantfiles with hardcoded cheap small LLM and 'questions' to get things like important files for summary, docs, etc
- for each question, answer it using a cheap LLM
- hardcoded questions as well as custom questions should be possible
- serve for free and publicly for any repo lazily, and cache answer. for private repos or custom questions require authentication...
- also serve an openapi
- unauthenticated users can generate with daily ratelimit, or see cached stuff for free. Authenticate and pay a small monthly fee to generate infinitely.

Nice hardcoded prompts:

- summary
- api dependencies
- npm package.json's -> main dependencies -> README thereof
