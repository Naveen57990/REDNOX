import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — GO KALI",
  description: "GO KALI privacy policy.",
};

const SECTIONS: { h: string; b: string }[] = [
  {
    h: "1. Overview",
    b: "GO KALI is committed to privacy. This policy explains what data we collect, why, and how you can control it. We collect the minimum needed to operate.",
  },
  {
    h: "2. Data we collect",
    b: "Account details (email, name, hashed password) when you register; a cookie with your session identifier; and, if configured, your OpenRouter API key stored in a secure encrypted cookie in your own browser. The sandbox and most tools run entirely in your browser without sending data to our servers.",
  },
  {
    h: "3. How we use data",
    b: "To run your account, keep you signed in, route AI assistant requests to your chosen provider, and improve the platform. We never sell personal data.",
  },
  {
    h: "4. AI requests",
    b: "Chat content in the AI assistant is sent to the third-party model provider you select (via OpenRouter) to generate responses. Do not submit sensitive personal data in conversations.",
  },
  {
    h: "5. Cookies",
    b: "We use an httpOnly, secure session cookie (gk_session). No advertising or cross-site tracking cookies are used.",
  },
  {
    h: "6. Analytics & logs",
    b: "Standard server logs may be retained briefly for security and diagnostics. These do not contain message contents.",
  },
  {
    h: "7. Your rights",
    b: "You may access, correct, export or request deletion of your account data at any time by contacting support@gokali.pro. Deleting your account deletes stored conversation data.",
  },
  {
    h: "8. Third parties",
    b: "AI requests are handled by OpenRouter and the model provider you select under their own privacy policies. We are not responsible for their practices.",
  },
  {
    h: "9. Children",
    b: "The service is not directed at children under 13 and we do not knowingly collect their data.",
  },
  {
    h: "10. Changes",
    b: "We may update this policy. Material changes will be posted here with an updated date.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Privacy <span className="text-neon">Policy</span>
      </h1>
      <p className="mt-3 text-sm text-muted">Last updated: September 2026</p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="font-semibold text-white">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.b}</p>
          </section>
        ))}
      </div>
    </main>
  );
}