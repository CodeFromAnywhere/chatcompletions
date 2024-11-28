# To stay in flow... First create a need: Githuy

- take githuq logic to forward https://githuy.com/OWNER/REPO/PAGE/BRANCH/...PATH to https://OWNER.githuy.com/REPO/extexe/BRANCH/...PATH
- deploy githuy at `*.githuy.com` (any subdomain) just like i did with gituq.com before
- confirm that current simple githuy works and it finds the codeblock and responds with it.
- It has been 11+ weeks ago that I started with extexe!!!! https://github.com/CodeFromAnywhere/iRFC-cloud
- migrate `set.ts` to `githuy` so it also finds openapi operations...

# What I need to keep gooing

Now I need improved chatcompletions API! What I need to keep going is:

- dynamic choice of what URLs to scrape before scraping them, based on prompt and system prompt
- multiple ways to scrape a URL: as image, as HTML, as markdown (or a combination)

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

# GET `llmtext.com/api/context`

There are multiple ways to parse an URL.

- as screenshot
- as pageshot
- as markdown
- as raw media/html
- as analyzed variant
- scraping more context after scraping the url as needed.
- ...there could be many more ways of url analysis that we haven't thought of yet...

How you want this to be analyzed also depends on the context... It may even be dependent on the result of parsing it one way that you'd decide you need to parse it another way as well.

https://x.com/mattppal/status/1861823809382498770

`GET llmtext.com/context?prompt=`: An endpoint that you pass `?prompt=` and it uses a `fetch` agent to process all URLs in the prompt based on the context in the prompt itself.

It should respond with image URLs as embeds (![](URL))
