import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";
import { generateBreakdown } from "@/lib/ai/breakdown";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const tasks = await prisma.task.findMany({
    where: {
      projectId: params.id,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.title) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      projectId: params.id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      userEstimatedMinutes: body.userEstimatedMinutes,
    },
  });

  if (body.autoBreakdown) {
    const breakdown = await generateBreakdown({
      title: task.title,
      description: task.description,
      userId: auth.userId,
    });
    const subtasks = await Promise.all(
      breakdown.subtasks.map(
        (item: { title: string; estimatedMinutes: number; orderIndex: number }) =>
          prisma.subtask.create({
            data: {
              taskId: task.id,
              title: item.title,
              estimatedMinutes: item.estimatedMinutes,
              orderIndex: item.orderIndex,
            },
          }),
      ),
    );
    return NextResponse.json({ task, subtasks }, { status: 201 });
  }

  return NextResponse.json({ task, subtasks: null }, { status: 201 });
}
