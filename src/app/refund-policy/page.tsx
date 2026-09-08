import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — GO KALI",
  description: "GO KALI refund policy — free means nothing to refund.",
};

const SECTIONS: { h: string; b: string }[] = [
  {
    h: "1. The short version",
    b: "GO KALI is free forever. There is no paid subscription required for any core feature, so there is nothing to refund under the free plan.",
  },
  {
    h: "2. Future paid features",
    b: "If we ever introduce optional paid features (e.g. Premium), each such purchase will come with a clear 14-day money-back guarantee, no questions asked. This page will be updated at that time.",
  },
  {
    h: "3. How to request a refund",
    b: "For any reason to request a refund or account-related billing help, email us at support@gokali.pro with your account email and order reference.",
  },
  {
    h: "4. Chargebacks",
    b: "We kindly ask that you contact us before filing a chargeback — issues are resolved fastest directly.",
  },
  {
    h: "5. Contact",
    b: "support@gokali.pro — we typically reply within 24 hours.",
  },
];

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Refund <span className="text-neon">Policy</span>
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