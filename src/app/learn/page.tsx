import type { Metadata } from "next";
import { LearnLibrary } from "@/components/learn/LearnLibrary";

export const metadata: Metadata = {
  title: "Kali Learn — CyberLab AI",
  description:
    "Master essential Kali Linux and Linux commands with syntax, flags, and safe practice examples.",
};

export default function LearnPage() {
  return <LearnLibrary />;
}