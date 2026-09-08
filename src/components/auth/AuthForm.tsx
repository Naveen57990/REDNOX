"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthFormInner({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin ? { email, password } : { name, email, password },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-edge bg-panel p-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-neon/50 bg-neon/10 text-neon mono text-xl font-bold">
            &gt;_
          </span>
          <h1 className="mt-4 text-2xl font-bold text-fg">
            {isLogin ? "Welcome Back" : "Join GO KALI"}
          </h1>
          <p className="mt-2 text-sm text-mut">
            {isLogin
              ? "Sign in to access your tools"
              : "Free forever. All features unlocked."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-mut">
                Name <span className="text-dim">(optional)</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="kali user"
                className="w-full rounded-lg border border-edge bg-abyss px-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-neon/60 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mut">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-edge bg-abyss px-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-neon/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mut">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Your password" : "Min 8 characters"}
              className="w-full rounded-lg border border-edge bg-abyss px-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-neon/60 focus:outline-none"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-mut">
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-edge bg-abyss px-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-neon/60 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-neon py-3 text-sm font-semibold text-abyss transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Free Account"}
          </button>
        </form>

        {isLogin && (
          <button
            onClick={() => {
              setError("");
              setEmail("demo@gokali.pro");
              setPassword("demo12345");
            }}
            className="mt-3 w-full rounded-lg border border-edge bg-panel2 py-2.5 text-xs text-mut transition-colors hover:border-neon/40 hover:text-neon"
          >
            Use demo account (demo@gokali.pro / demo12345)
          </button>
        )}

        <p className="mt-6 text-center text-sm text-mut">
          {isLogin ? (
            <>
              New to GO KALI?{" "}
              <Link href="/signup" className="font-medium text-neon hover:underline">
                Create Free Account →
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-neon hover:underline">
                Sign In
              </Link>
            </>
          )}
        </p>
      </div>
      <p className="mt-6 text-center text-xs text-dim">
        ⚠️ Educational purposes only. Use responsibly and legally.
      </p>
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}