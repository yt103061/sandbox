import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/utils/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });

  if (error?.message?.includes("already")) {
    return NextResponse.json({ error: "email_exists" }, { status: 409 });
  }

  if (error) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const response = NextResponse.json(
    { user: data.user, session: data.session },
    { status: 201 },
  );

  if (data.session?.access_token) {
    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
