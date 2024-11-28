# contextApiKey

Allow for contextApiKey that gets removed from cache and, if used, cache isn't accessible without it being provided again. Otherwise we get apiKeys from uithub in the URL etc. Don't want that.

If I want to use this for multiple urls however, it seems more logical to provide a URL leading to an api key map object for each domain.

# ACIDly Avoid multiple generations

Immediately insert a KV key for any visited URL that ensures any other calls to the same URL enter a waiting pattern for the same generation to be done. Ensure this is as ACID as possible on Cloudflare. Upstash Redis is maybe best. If I can be 100% sure that there's only 1 generation, it will be a lot better. This pattern would be great EVERYWHERE.

Use https://upstash.com/blog/lock

# Queue

If it breaks after multiple attempts, add logic to create a queue so it gets done at some point.

QStash queue as a fallback when it fails is great to ensure quickest possible delivery and most reliable at the same time.

# HTML Version

The html version returned now is ugly, simple, and potentially slow.

An alternative would be to return early with a HTML variant whenever HTML is requested that isn't a direct cache hit

This HTML could:

- show all parameters as form so you can change them
- do the request on initialisation and show loading indicator until complete
- use `stream` to progressively see result
- add link to see the result in raw

# Streaming

I already had a hacky version before, but what I'd want is to have a flag to stream the first codeblock only, and stop streaming once the codeblock finishes.

Also regular streaming of the content output would be great.

# Landingpages

Focus on `/base/*` with some examples that can be clicked

On claudeflair, add proxy to https://chatcompletions.com that is just https://claudeflair.com/from/{url}/prompt/{prompt} (model and basepath pre-filled)

# Pricing structure

https://developers.cloudflare.com/r2/pricing/

0.001175 per MB per year with 1000 requests.
To generate with 200k Million input/output tokens (to get 1mb) it would cost at least 3.6 cents.
Therefore the storage is much cheaper than the generation.

Therefore, for the storage I can probably charge 1 cent per megatoken and still be fine.

## Same concept but for OpenAPI operations

- URL: https://actionschema.com/[domain]/[operationId]?openapiApiKey=&contextApiKey=&contextUrl=&params...
- Takes a JSON as context, adds other params, executes operation with that as input (via semantic operation principle) and stores result in the same way. Only difference is that here the cache mechanism works differently.

IDK Though... may be not now! Maybe I SHOULD dive into this though at some point again. Especially with the JSON pointers, it's very interesting. But this may not be the best approach.

# Paywall

- Also add in a paywall? Maybe later
- Feature flag to automatically charge a user for a generation. For this, we need to use `waitUntil` to calculate the cost made and charge based on a provided configuration (chargeUrl, secret, userId)
- In uithub, create a `GET /charge` endpoint that takes the `?apiKey&userId&promptTokens&completionTokens&llmConfig&estimatedCost` and charges the user in the way we want (custom logic).- After it works, use it in a simple worker `analyse-issue` that just creates `{ plan:string; extraContextNeeded:string; confidence:number; needsCodeChanges:boolean; answer: string; }` based on the relevant code. Let's make a wrapping function `paidChat` that simply calls this API.

# Increased output length

If the result has a non-terminated codeblock, it should be able to continue from after an exact character, and ultimately concatenate all json chunks generated, responding with one complete JSON.

# Open router

Integrate with https://openrouter.ai/models in a way that makes it easy to find available models.

# Tools with instant prompt and codeblock input or output

I need a streaming API that goes from prompt to hosted files. Together with a simple fetch api this is a killer coding agent that allows for making a more scalable website.

🤔 The `content/set` tool is great, but if we would use it as an agent, it would not make the code visible, or it would need to generate the code twice. Rather than that, we can move the code for this tool to the backend by asking the agent to execute after the end of the codeblock. However, it should be given previousCodeblock automatically.

In `/chat/completion`, allow setting a `codeblockOperationId` and `promptOperationId` which contain operationId of the openapi that should recieve `code+language` and `prompt` automatically. This should remove these toplevel params from the context of the tool, and attach them automatically.

Now, instruct an agent to call after generating code. The resulting links shall now appear as part of the text generation, making it much more performant, and elegant 💪🔥

Now we can simplify and generalise the chat frontend, because the info is in the markdown, which can be rendered as required.

This further brings the ability to use code generation tools anywhere.

<!--
After I have this, create a tool that stream responds the first codeblock with keep-alive and stops at the end. This tool can be used from `generateHtmlMiddleware` and I never need to think about HTML anymore. The LOC of all my repos become much smaller!

Insight: this is my core competency, as it will improve the API. I'm wasting too much time on frontend, I can test programatically!
-->
