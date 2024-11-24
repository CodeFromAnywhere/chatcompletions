[OpenAPI](https://chatcompletions.com/openapi.html) | [TODO](TODO.md)

# Requirements

- Easy to self-host using cloudflare
- Except for the cache, fully stateless
- Very efficient and performant cache for LLMs
- Easy to remove parts of cache while keeping some generations for very long
- Parses codeblocks
- Handle 429s gracefully (exponential backoff)

# Similar work

- https://github.com/codefromanywhere/claudeflair
- https://github.com/codefromanywhere/openapi-chat-completion
- https://github.com/codefromanywhere/tool-agent
- https://github.com/codefromanywhere/chat-completion-overlay
