import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";
import { projectSchema } from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  const userId = auth.userId;

  const where = {
    userId,
    ...(status ? { status: status as any } : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({ projects, total });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const userId = auth.userId;
  const project = await prisma.project.create({
    data: {
      userId,
      name: parsed.data.name,
      description: parsed.data.description,
      clientId: parsed.data.clientId,
      budgetMinutes: parsed.data.budgetMinutes,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      hourlyRate: parsed.data.hourlyRate,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
