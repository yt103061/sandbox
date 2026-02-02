import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const userId = auth.userId;

  if (body.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: body.taskId, project: { userId } },
    });
    if (!task) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  const activeEntry = await prisma.timeEntry.findFirst({
    where: { userId, endedAt: null },
  });

  if (activeEntry) {
    return NextResponse.json({ error: "active_entry_exists" }, { status: 400 });
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      userId,
      taskId: body.taskId,
      subtaskId: body.subtaskId,
      startedAt: new Date(),
      note: body.note,
    },
  });

  if (body.taskId) {
    await prisma.task.update({
      where: { id: body.taskId },
      data: { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json({ timeEntry }, { status: 201 });
}
