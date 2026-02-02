import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const userId = auth.userId;
  const clients = await prisma.client.findMany({ where: { userId } });

  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  if (!body.name) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      userId: auth.userId,
      name: body.name,
      email: body.email,
      company: body.company,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
