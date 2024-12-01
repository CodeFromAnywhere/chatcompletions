# Improved API

- Add some grace for 429 to `/base/*`. Besides using exponential backoff, use `x-ratelimit-*` headers indicating when we can use stuff again. Max 5x retry by default
- Install json-ptr that can do wildcard `*` as well. Parse input context with JSON pointer
- Always attach `?prompt=` to the contextUrl so if the context actually requires it, it can use it to provide improved context.
- If `contextUrl` URL responds with anything that contains embeds (![](URL)) it can assume these are images and add them to the images input of the LLM
- Prompt must be able to be a URL as well
- Context must be able to be text as well rather than a URL

# OpenAPI tool use

Plug in `POST /chat/completions` as well that uses the same cache but just regular `output` as output

Also allow https://chatcompletions.com/OPENAPI_URL as basepath for both `/chat/completions` as well as for `/base`. Base should use `/chat/completions` since it has support for OpenAPI already.

OpenAPI tool use is needed sometimes!

# Data Visualisation

This can actually be its own website too that just renders data from any URL. However, it should also be built-in to chatcompletions.com. Let's first focus on that.

- any piece of data if it's an array that is mostly flat: https://www.ag-grid.com/javascript-data-grid/getting-started/
- Other JSON or YAML: https://jsontr.ee
- SVG or other image: `<img>`

# HTML Injection

Inject <meta property="og:image" content="https://quickog.com/image/{url}" /> if there was no og:image

Inject that toolbar what I had with iRFC as well. But rather it should just link to `/result.html` when clicked.
