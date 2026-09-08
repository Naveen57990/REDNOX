import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";
import { findUserById } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "insecure-dev-secret-change-me",
);

export const SESSION_COOKIE = "gk_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function signToken(userId: string, email: string) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function setSessionCookie(
  res: NextResponse,
  token: string,
): Promise<void> {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(res: NextResponse): Promise<void> {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: (payload.email as string) || "",
      name: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await verifyToken(token);
    if (!session) return null;
    const row = findUserById(session.id);
    if (!row) return null;
    return { id: row.id, email: row.email, name: row.name };
  } catch {
    return null;
  }
}