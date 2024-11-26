import { Usage } from "./types.js";
import chatCompletionProviders from "./public/providers.json";

export const calculateCost = (
  context: { provider: string; model: string } & Usage,
) => {
  const { provider, model, completion_tokens, prompt_tokens } = context;
  if (!provider || !model || !completion_tokens || !prompt_tokens) {
    return;
  }
  const modelInfo = chatCompletionProviders[
    provider as keyof typeof chatCompletionProviders
  ]?.models?.filter((item: any) => item.id === model)[0];
  if (!modelInfo) {
    return;
  }

  const prompt_cost = (prompt_tokens * modelInfo.promptCpm) / 1000000;
  const output_cost = (completion_tokens * modelInfo.completionCpm) / 1000000;
  const total_cost = prompt_cost + output_cost;
  return { prompt_cost, output_cost, total_cost };
};
