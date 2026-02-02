import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const userId = auth.userId;
  const taskId = request.nextUrl.searchParams.get("taskId") ?? undefined;
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");

  const startedAt = startDate
    ? (() => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(startDate);
        end.setHours(23, 59, 59, 999);
        return { gte: start, lte: end };
      })()
    : undefined;

  const entries = await prisma.timeEntry.findMany({
    where: { userId, taskId, startedAt },
    take: limit,
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ timeEntries: entries, total: entries.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!body.startedAt || !body.endedAt) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const startedAt = new Date(body.startedAt);
  const endedAt = new Date(body.endedAt);
  if (endedAt <= startedAt) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  if (body.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: body.taskId, project: { userId: auth.userId } },
    });
    if (!task) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  const durationMinutes = Math.round(
    (endedAt.getTime() - startedAt.getTime()) / 60000,
  );

  const timeEntry = await prisma.timeEntry.create({
    data: {
      userId: auth.userId,
      taskId: body.taskId,
      subtaskId: body.subtaskId,
      startedAt,
      endedAt,
      durationMinutes,
      note: body.note,
      isManual: true,
    },
  });

  return NextResponse.json({ timeEntry }, { status: 201 });
}
