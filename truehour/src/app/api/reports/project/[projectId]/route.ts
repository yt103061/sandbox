import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const project = await prisma.project.findFirst({
    where: { id: params.projectId, userId: auth.userId },
  });

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: params.projectId },
    include: { timeEntries: true },
  });

  const actualMinutes = tasks.reduce(
    (sum, task) =>
      sum +
      task.timeEntries.reduce(
        (taskSum, entry) => taskSum + (entry.durationMinutes ?? 0),
        0,
      ),
    0,
  );

  const remainingMinutes = project.budgetMinutes
    ? project.budgetMinutes - actualMinutes
    : null;

  return NextResponse.json({
    project,
    budgetMinutes: project.budgetMinutes,
    actualMinutes,
    remainingMinutes,
    effectiveHourlyRate: project.hourlyRate,
    tasks,
    timeline: [],
  });
}
