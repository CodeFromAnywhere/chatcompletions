[OpenAPI](https://chatcompletions.com/openapi.html) | [TODO](TODO.md)

# Requirements

- Easy to self-host using Cloudflare
- Except for the cache, fully stateless
- Very efficient and performant cache for LLMs
- Cache cost calculation and monetisation
- Parses codeblocks
- Handle 429s gracefully (exponential backoff and looking at X-ratelimit headers)

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
