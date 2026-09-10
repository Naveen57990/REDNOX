import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const primaryDbPath =
  process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

function initDatabase(file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new Database(file, { timeout: 5000 });
  d.pragma("journal_mode = WAL");
  d.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT 'New chat',
  messages   TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS progress (
  user_id    TEXT PRIMARY KEY,
  state      TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
  // Seed a demo account on first run so the demo login button works instantly.
  const demoHash = bcrypt.hashSync("demo12345", 10);
  d.prepare(
    "INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
  ).run(randomUUID(), "Demo User", "demo@gokali.pro", demoHash);
  return d;
}

// Serverless (Vercel) runs have a read-only working dir, so fall back to the
// OS temp dir where a fresh (ephemeral) database can still be created.
let db: Database.Database;
try {
  db = initDatabase(primaryDbPath);
} catch {
  db = initDatabase(path.join(os.tmpdir(), "rednox-app.db"));
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): UserRow {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
  ).run(id, input.name, input.email, input.passwordHash);
  return findUserById(id) as UserRow;
}

export function getProgress(userId: string): string | null {
  const row = db
    .prepare("SELECT state FROM progress WHERE user_id = ?")
    .get(userId) as { state: string } | undefined;
  return row?.state ?? null;
}

export function setProgress(userId: string, state: string): void {
  db.prepare(
    "INSERT INTO progress (user_id, state, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at",
  ).run(userId, state);
}