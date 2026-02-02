import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!body.timeEntryId) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const endedAt = new Date();
  const existing = await prisma.timeEntry.findFirst({
    where: { id: body.timeEntryId, userId: auth.userId },
    include: { task: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const timeEntry = await prisma.timeEntry.update({
    where: { id: body.timeEntryId },
    data: {
      endedAt,
      note: body.note,
    },
    include: { task: true },
  });

  const durationMinutes = timeEntry.startedAt
    ? Math.round((endedAt.getTime() - timeEntry.startedAt.getTime()) / 60000)
    : null;

  const updated = await prisma.timeEntry.update({
    where: { id: body.timeEntryId },
    data: { durationMinutes },
  });

  if (timeEntry.task && durationMinutes) {
    await prisma.taskHistory.create({
      data: {
        userId: auth.userId,
        normalizedType: timeEntry.task.title.toLowerCase().replace(/\s+/g, "_"),
        originalTitle: timeEntry.task.title,
        estimatedMinutes: timeEntry.task.userEstimatedMinutes ?? durationMinutes,
        actualMinutes: durationMinutes,
      },
    });
  }

  return NextResponse.json({ timeEntry: updated });
}
