import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionUserId, verifyDemoPassword } from "@/lib/auth";
import { jsonError } from "@/lib/api-helpers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid email or password", 400);
  }

  const { email, password } = parsed.data;

  if (!verifyDemoPassword(password)) {
    return jsonError("Invalid email or password", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
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
    return jsonError("Invalid email or password", 401);
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
