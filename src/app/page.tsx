import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "AGENT") redirect("/agent");
    if (user?.role === "CUSTOMER") redirect("/customer");
  }

  redirect("/login");
}
