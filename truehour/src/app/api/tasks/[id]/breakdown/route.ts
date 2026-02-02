import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { generateBreakdown } from "@/lib/ai/breakdown";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const task = await prisma.task.findFirst({
    where: { id: params.id, project: { userId: auth.userId } },
    include: { project: true, subtasks: true },
  });

  if (!task) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (body.regenerate) {
    await prisma.subtask.deleteMany({ where: { taskId: params.id } });
  }

  const result = await generateBreakdown({
    title: task.title,
    description: task.description,
    projectName: task.project?.name,
    context: body.context,
    userId: auth.userId,
  });

  const createdSubtasks = await Promise.all(
    result.subtasks.map((subtask: { title: string; estimatedMinutes: number; orderIndex: number }) =>
      prisma.subtask.create({
        data: {
          taskId: params.id,
          title: subtask.title,
          estimatedMinutes: subtask.estimatedMinutes,
          orderIndex: subtask.orderIndex,
        },
      }),
    ),
  );

  return NextResponse.json({
    subtasks: createdSubtasks,
    totalEstimatedMinutes: result.totalEstimatedMinutes,
    confidence: result.confidence,
    basedOnHistoryCount: result.basedOnHistoryCount,
  });
}
