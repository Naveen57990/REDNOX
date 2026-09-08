import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { setSessionCookie, signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const token = await signToken(user.id, user.email);
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  await setSessionCookie(res, token);
  return res;
}