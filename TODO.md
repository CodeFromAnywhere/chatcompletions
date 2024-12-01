# Improved API

- Install json-ptr that can do wildcard `*` as well. Allows parsing input context with JSON pointer
- Always attach `?prompt=` to the contextUrl so if the context actually requires it, it can use it to provide improved context.
- If `contextUrl` URL responds with anything that contains embeds (![](URL)) it can assume these are images and add them to the images input of the LLM
- Prompt must be able to be a URL as well
- Context must be able to be text as well rather than a URL
- Add some grace for 429 to `/base/*`. Besides using exponential backoff, use `x-ratelimit-*` headers indicating when we can use stuff again. Max 5x retry by default

# OpenAPI tool use

Plug in `POST /chat/completions` as well that uses the same cache but just regular `output` as output

Also allow https://chatcompletions.com/OPENAPI_URL as basepath for both `/chat/completions` as well as for `/base`. Base should use `/chat/completions` since it has support for OpenAPI already.

OpenAPI tool use is needed sometimes!
