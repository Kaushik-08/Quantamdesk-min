import { cookies } from "next/headers";

export const SESSION_COOKIE = "qd_session";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo123";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "AGENT";
  orgId: string;
  orgName: string;
};

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function verifyDemoPassword(password: string): boolean {
  return password === DEMO_PASSWORD;
}
