import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/supabase/middleware";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const existing = await prisma.client.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name,
      email: body.email,
      company: body.company,
    },
  });

  return NextResponse.json({ client });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (auth?.response) return auth.response;

  const existing = await prisma.client.findFirst({
    where: { id: params.id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
