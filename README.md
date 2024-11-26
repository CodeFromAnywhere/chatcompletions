# Chat Completions

> Accessible Transformations for All

[OpenAPI](https://chatcompletions.com/openapi.html) | [TODO](TODO.md)

# Requirements

- Practically No Ratelimit
- Easy to self-host using Cloudflare
- LLM agnostic. Except for the cache, fully stateless.
- Very efficient and performant cache for LLMs
- Structured output from various formats (Parses codeblocks)

# Wishlist after it gets popular

- Add [lifecycle with expiry](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) and ensure to add a caching policy with cloudflare cache so my worker isn't even hit. Now cost is $15/TB/month.
- Add authentication and monetisation and ensure to count amount of GB stored per user.
- Cache cost calculation and monetisation
- Add endpoint to delete a range or a key.

# Usage

The `POST /chat/completions` endpoint works the same as any other.

The GET Address makes it easy to share generations with anyone. For example, to use claude with any context and any prompt:

https://chatcompletions.com/base/anthropic.actionschema.com/model/claude-3-5-sonnet-20241022/from/[url]/prompt/[prompt]/output.md

The generation will be available publicly after generation!

# Similar work

- https://github.com/codefromanywhere/claudeflair
- https://github.com/codefromanywhere/openapi-chat-completion
- https://github.com/codefromanywhere/tool-agent
- https://github.com/codefromanywhere/chat-completion-overlay
