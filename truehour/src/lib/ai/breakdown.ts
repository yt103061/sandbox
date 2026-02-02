import { callAnthropic } from "./client";
import { BREAKDOWN_PROMPT } from "./prompts";

interface BreakdownInput {
  title: string;
  description?: string | null;
  projectName?: string | null;
  context?: string | null;
  userId?: string;
}

export async function generateBreakdown(input: BreakdownInput) {
  const { prisma } = await import("@/lib/prisma/client");
  const normalizedType = input.title.toLowerCase().replace(/\s+/g, "_");
  const history = input.userId
    ? await prisma.taskHistory.findMany({
        where: { userId: input.userId, normalizedType },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      subtasks: [
        { title: "要件整理", estimatedMinutes: 60, orderIndex: 1 },
        { title: "作業実施", estimatedMinutes: 180, orderIndex: 2 },
        { title: "レビュー対応", estimatedMinutes: 60, orderIndex: 3 },
      ],
      totalEstimatedMinutes: 300,
      confidence: 0.42,
      basedOnHistoryCount: history.length,
    };
  }

  const prompt = BREAKDOWN_PROMPT.user_template
    .replace("{{title}}", input.title)
    .replace("{{description}}", input.description ?? "")
    .replace("{{projectName}}", input.projectName ?? "")
    .replace("{{context}}", input.context ?? "")
    .replace(
      /\{\{#each history\}\}[\s\S]*\{\{\/each\}\}/,
      history
        .map(
          (item) =>
            `- "${item.originalTitle}": estimated=${item.estimatedMinutes}min, actual=${item.actualMinutes}min`,
        )
        .join("\n"),
    );

  const response = await callAnthropic({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: BREAKDOWN_PROMPT.system,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response?.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);

  return {
    subtasks: parsed.subtasks ?? [],
    totalEstimatedMinutes: parsed.totalEstimatedMinutes ?? 0,
    confidence: parsed.confidence ?? 0,
    basedOnHistoryCount: history.length,
  };
}
