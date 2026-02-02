import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "./server";

export async function requireAuth(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.cookies.get("sb-access-token")?.value;

  if (!token) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  return { userId: data.user.id };
}
