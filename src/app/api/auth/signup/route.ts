import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { setSessionCookie, signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 60);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (findUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name, email, passwordHash });
  const token = await signToken(user.id, user.email);

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  await setSessionCookie(res, token);
  return res;
}