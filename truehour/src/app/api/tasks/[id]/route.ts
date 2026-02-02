import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const task = await prisma.task.findFirst({
    where: { id: params.id, project: { userId: auth.userId } },
    include: { subtasks: true, timeEntries: true },
  });

  if (!task) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const stats = {
    actualMinutes: task.timeEntries.reduce(
      (sum, entry) => sum + (entry.durationMinutes ?? 0),
      0,
    ),
  };
  return NextResponse.json({
    task,
    subtasks: task.subtasks,
    timeEntries: task.timeEntries,
    stats,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const existing = await prisma.task.findFirst({
    where: { id: params.id, project: { userId: auth.userId } },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      userEstimatedMinutes: body.userEstimatedMinutes,
      scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
      scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : undefined,
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const existing = await prisma.task.findFirst({
    where: { id: params.id, project: { userId: auth.userId } },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
