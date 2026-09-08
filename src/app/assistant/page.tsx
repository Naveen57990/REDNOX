import type { Metadata } from "next";
import { AssistantChat } from "@/components/assistant/AssistantChat";

export const metadata: Metadata = {
  title: "AI Assistant — CyberLab AI",
  description:
    "Ask me anything about authorized cybersecurity learning — Kali Linux, tools, commands, networking and methodology.",
};

export default function AssistantPage() {
  return <AssistantChat />;
}