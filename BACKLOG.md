# Increased output length

If the result has a non-terminated codeblock, it should be able to continue from after an exact character, and ultimately concatenate all json chunks generated, responding with one complete JSON.

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

## Same concept but for OpenAPI operations

- URL: https://actionschema.com/[domain]/[operationId]?openapiApiKey=&contextApiKey=&contextUrl=&params...
- Takes a JSON as context, adds other params, executes operation with that as input (via semantic operation principle) and stores result in the same way. Only difference is that here the cache mechanism works differently.

IDK Though... may be not now! Maybe I SHOULD dive into this though at some point again. Especially with the JSON pointers, it's very interesting. But this may not be the best approach.
