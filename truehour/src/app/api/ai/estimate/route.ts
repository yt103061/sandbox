import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/middleware";
import { generateEstimate } from "@/lib/ai/estimate";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!body.title) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const result = await generateEstimate({
    title: body.title,
    context: body.context,
    includeBreakdown: body.includeBreakdown,
    userId: auth.userId,
  });

  return NextResponse.json(result);
}
