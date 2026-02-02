import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const userId = auth.userId;
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const entries = await prisma.timeEntry.findMany({
    where: { userId, startedAt: { gte: start, lte: end } },
  });

  const totalMinutes = entries.reduce(
    (sum, entry) => sum + (entry.durationMinutes ?? 0),
    0,
  );

  return NextResponse.json({
    date: start.toISOString().split("T")[0],
    totalMinutes,
    entries,
    byProject: [],
  });
}
