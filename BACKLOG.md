## Same concept but for OpenAPI operations

- URL: https://actionschema.com/[domain]/[operationId]?openapiApiKey=&contextApiKey=&contextUrl=&params...
- Takes a JSON as context, adds other params, executes operation with that as input (via semantic operation principle) and stores result in the same way. Only difference is that here the cache mechanism works differently.

IDK Though... may be not now! Maybe I SHOULD dive into this though at some point again. Especially with the JSON pointers, it's very interesting. But this may not be the best approach.

# Paywall

- Also add in a paywall? Maybe later
- Feature flag to automatically charge a user for a generation. For this, we need to use `waitUntil` to calculate the cost made and charge based on a provided configuration (chargeUrl, secret, userId)
- In uithub, create a `GET /charge` endpoint that takes the `?apiKey&userId&promptTokens&completionTokens&llmConfig&estimatedCost` and charges the user in the way we want (custom logic).- After it works, use it in a simple worker `analyse-issue` that just creates `{ plan:string; extraContextNeeded:string; confidence:number; needsCodeChanges:boolean; answer: string; }` based on the relevant code. Let's make a wrapping function `paidChat` that simply calls this API.

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

# Chat system prompt from urls

Example: `Make the complete openapi.json specification file that specifies what is implemented in this code: https://uithub.com/BrandwatchLtd/bcr-api/tree/master/src/bcr_api`

This should expand into the systemprompt being appended with the contents of the url.

If the result has a non-terminated codeblock, it should be able to continue from after an exact character, and ultimately concatenate all json chunks generated, responding with one complete JSON.

The result should be cached by default. Since we need context, a simple rule to expand urls as context is enough, we don't need to do this for all tools per se, but that could be done later too.

Cached results should not require authentication and can be made into an URL by looking at the hash.

Having this as a standalone cacheable api is super powerful, especially if it's url-based.

# Open router

Integrate with https://openrouter.ai/models in a way that makes it easy to find available models.
