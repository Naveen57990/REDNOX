import type { Metadata } from "next";
import { Explorer } from "@/components/explorer/Explorer";

export const metadata: Metadata = {
  title: "Explorer — CyberLab AI",
  description:
    "Discover cybersecurity tools and concepts. Search, filter by category, and learn safe, authorized usage.",
};

export default function ExplorerPage() {
  return <Explorer />;
}