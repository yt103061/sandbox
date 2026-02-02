import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const existing = await prisma.subtask.findFirst({
    where: { id: params.id, task: { project: { userId: auth.userId } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const subtask = await prisma.subtask.update({
    where: { id: params.id },
    data: {
      title: body.title,
      estimatedMinutes: body.estimatedMinutes,
      isCompleted: body.isCompleted,
      orderIndex: body.orderIndex,
    },
  });

  return NextResponse.json({ subtask });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const existing = await prisma.subtask.findFirst({
    where: { id: params.id, task: { project: { userId: auth.userId } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.subtask.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
