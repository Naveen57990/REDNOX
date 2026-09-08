import type { Metadata } from "next";
import { RoadmapApp } from "@/components/roadmap/RoadmapApp";

export const metadata: Metadata = {
  title: "Road Map — CyberLab AI",
  description:
    "A structured cybersecurity learning roadmap from fundamentals to advanced practice, with dynamic progress tracking.",
};

export default function RoadmapPage() {
  return <RoadmapApp />;
}