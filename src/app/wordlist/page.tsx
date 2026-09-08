import type { Metadata } from "next";
import { WordlistBuilder } from "@/components/lab/WordlistBuilder";

export const metadata: Metadata = {
  title: "Word Gen — CyberLab AI",
  description:
    "Generate targeted wordlists for authorized password auditing and CTFs — prefixes, suffixes, numbers, special characters and length controls.",
};

export default function WordlistPage() {
  return <WordlistBuilder />;
}