import type { Metadata } from "next";
import { ProfileApp } from "@/components/progress/ProfileApp";

export const metadata: Metadata = {
  title: "My Progress — GO KALI",
  description:
    "Your XP, level, streak, skill bars and achievements — everything earning across missions, challenges, detective cases and the lab terminal.",
};

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">My Progress</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your <span className="text-neon">scoring</span> sheet
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Everything you do around the site feeds this profile: missions, daily
          challenges, detective cases, tool installs and terminal practice.
          Progress is saved locally and synced to your account when you&apos;re
          signed in.
        </p>
      </div>
      <ProfileApp />
    </main>
  );
}