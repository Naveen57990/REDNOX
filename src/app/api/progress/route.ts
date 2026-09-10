import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProgress, setProgress } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = getProgress(user.id);
  return NextResponse.json({ state: raw ? JSON.parse(raw) : null });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let state: unknown;
  try {
    const body = await request.json();
    state = body?.state;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!state || typeof state !== "object")
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  setProgress(user.id, JSON.stringify(state));
  return NextResponse.json({ ok: true });
}