import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up — GO KALI",
  description: "Create a free GO KALI account.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}