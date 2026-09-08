import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — GO KALI",
  description: "Sign in to your GO KALI account.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}