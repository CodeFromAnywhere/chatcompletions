import { parseBasePath } from "./parseBasePath.js";

// Test cases
const testCases = [
  {
    url: "/base/openai/model/gpt4/from/context123/prompt/hello/output.json",
    expected: {
      llmBasePath: "openai",
      llmModelName: "gpt4",
      contextUrl: "context123",
      prompt: "hello",
      ext: "json",
    },
  },
  {
    url: "/base/anthropic.actionschema.com/model/claude-3-5-sonnet-20241022/from/uithub.com/codefromanywhere/chatcompletions/prompt/what%20makes%20this%20api%20special/output.md",
    expected: {
      llmBasePath: "anthropic.actionschema.com",
      llmModelName: "claude-3-5-sonnet-20241022",
      contextUrl: "uithub.com/codefromanywhere/chatcompletions",
      prompt: "what%20makes%20this%20api%20special",
      ext: "md",
    },
  },
  {
    url: "/base/openai/model/gpt4/prompt/direct-prompt/output@/specific/field.json",
    expected: {
      llmBasePath: "openai",
      llmModelName: "gpt4",
      prompt: "direct-prompt",
      outputJsonPointer: "/specific/field",
      ext: "json",
    },
  },
  {
    url: "/base/openai/model/gpt4/from/context@/path/to/data/prompt/complex/output@/response/text.md",
    expected: {
      llmBasePath: "openai",
      llmModelName: "gpt4",
      contextUrl: "context",
      contextJsonPointer: "/path/to/data",
      prompt: "complex",
      outputJsonPointer: "/response/text",
      ext: "md",
    },
  },
  {
    url: "/base/anthropic/model/claude2/prompt/simple/output.txt",
    expected: {
      llmBasePath: "anthropic",
      llmModelName: "claude2",
      prompt: "simple",
      ext: "txt",
    },
  },
];

// Run tests
testCases.forEach((testCase, index) => {
  const result = parseBasePath(testCase.url);
  console.log(`\nTest ${index + 1}:`);
  console.log("URL:", testCase.url);
  console.log("Result:", result);
  console.log("Expected:", testCase.expected);
  const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
  console.log("Passed:", passed);
  if (!passed) {
    console.log("Difference:", {
      result,
      expected: testCase.expected,
    });
  }
});
