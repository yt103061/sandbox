import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: { tasks: true },
  });

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const totalMinutes = await prisma.timeEntry.aggregate({
    where: { task: { projectId: params.id } },
    _sum: { durationMinutes: true },
  });

  const stats = {
    totalMinutes: totalMinutes._sum.durationMinutes ?? 0,
    budgetMinutes: project.budgetMinutes,
  };

  return NextResponse.json({ project, tasks: project.tasks, stats });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const existing = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
      clientId: body.clientId,
      budgetMinutes: body.budgetMinutes,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      hourlyRate: body.hourlyRate,
    },
  });

  return NextResponse.json({ project });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const existing = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
