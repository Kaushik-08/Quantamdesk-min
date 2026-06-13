import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDemoPasswordConfigured, setSessionUserId } from "@/lib/auth";
import { jsonError } from "@/lib/api-helpers";
import { z } from "zod";

const demoLoginSchema = z.object({
  email: z.string().email(),
});

export async function GET() {
  return NextResponse.json({ configured: isDemoPasswordConfigured() });
}

export async function POST(request: Request) {
  if (!isDemoPasswordConfigured()) {
    return jsonError("Demo login is not configured — set DEMO_PASSWORD in .env", 503);
  }

  const body = await request.json().catch(() => null);
  const parsed = demoLoginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid email", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      orgId: true,
      organization: { select: { name: true } },
    },
  });

  if (!user) {
    return jsonError("Demo account not found", 404);
  }

  await setSessionUserId(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      orgName: user.organization.name,
    },
  });
}
