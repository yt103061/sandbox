import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const format = request.nextUrl.searchParams.get("format");
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");
  if (!format || !startDate || !endDate) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  if (!["pdf", "csv"].includes(format)) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  return NextResponse.json({
    downloadUrl: `https://example.com/export.${format}`,
  });
}
