import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const dbPath =
  process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { timeout: 5000 });

db.pragma("journal_mode = WAL");

db.exec(`
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
`);

// Seed a demo account on first run so the demo login button works instantly.
const demoHash = bcrypt.hashSync("demo12345", 10);
db.prepare(
  "INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
).run(randomUUID(), "Demo User", "demo@gokali.pro", demoHash);

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