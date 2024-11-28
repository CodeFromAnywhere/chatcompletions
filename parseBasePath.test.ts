import { parseBasePath } from "./base.js";

const testCases = [
  "/base/anthropic/model/claude2/prompt/test/result.txt",
  "/base/openai/model/gpt4/prompt/complex/codeblocks.json",
  "/base/anthropic/model/claude3/prompt/analysis/content.md",
  "/from/example.com/base/anthropic/model/claude2/prompt/test/result.txt",
  "/from/api.test@/data/items/base/openai/model/gpt4/prompt/get/codeblock.py",
  "/base/anthropic/model/claude2/prompt/test/invalid.txt",
  "/from/test/base/ai/model/gpt4/prompt/demo/result@/data.json",
];

testCases.forEach((url, i) => {
  console.log(`\nTest ${i + 1}:`, url);
  console.log("Result:", parseBasePath(url));
});
