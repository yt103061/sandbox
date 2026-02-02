import { callAnthropic } from "./client";
import { ESTIMATE_PROMPT } from "./prompts";

interface EstimateInput {
  title: string;
  context?: string | null;
  includeBreakdown?: boolean;
  userId: string;
}

export async function generateEstimate(input: EstimateInput) {
  const { prisma } = await import("@/lib/prisma/client");
  const normalizedType = input.title.toLowerCase().replace(/\s+/g, "_");
  const history = await prisma.taskHistory.findMany({
    where: { userId: input.userId, normalizedType },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      estimatedMinutes: 240,
      confidence: 0.5,
      range: { min: 180, max: 300 },
      breakdown: input.includeBreakdown
        ? [{ title: "作業工程", estimatedMinutes: 180 }]
        : null,
      similarTasks: history,
      suggestion: "過去実績がないため余裕を持った見積もりを推奨します。",
    };
  }

  const prompt = ESTIMATE_PROMPT.user_template
    .replace("{{title}}", input.title)
    .replace("{{context}}", input.context ?? "")
    .replace("{{includeBreakdown}}", String(input.includeBreakdown ?? false))
    .replace(
      /\{\{#each history\}\}[\s\S]*\{\{\/each\}\}/,
      history
        .map(
          (item) =>
            `- type="${item.normalizedType}", estimated=${item.estimatedMinutes}, actual=${item.actualMinutes}`,
        )
        .join("\n"),
    );

  const response = await callAnthropic({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: ESTIMATE_PROMPT.system,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response?.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);

  return {
    estimatedMinutes: parsed.estimatedMinutes ?? 0,
    confidence: parsed.confidence ?? 0,
    range: parsed.range ?? { min: 0, max: 0 },
    breakdown: parsed.breakdown ?? null,
    similarTasks: history,
    suggestion: parsed.suggestion ?? "",
  };
}
