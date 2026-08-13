"use client";

import { useState } from "react";
import { Field, PrimaryButton, TextInput } from "@/components/Ui";
import { DEMO_PLAN_AMOUNT_KOBO } from "@/lib/demo-data";

type Props = {
  professionalName: string;
  onSuccess: (reference: string) => Promise<void>;
  onCancel: () => void;
};

/** Presentation-only Paystack-style checkout. Accepts test card 4084… */
export function PaystackMockCheckout({ professionalName, onSuccess, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("4084084084084081");
  const [expiry, setExpiry] = useState("12/30");
  const [cvv, setCvv] = useState("408");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const naira = (DEMO_PLAN_AMOUNT_KOBO / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = card.replace(/\s+/g, "");
    if (digits !== "4084084084084081") {
      setError("Use Paystack test card 4084 0840 8408 4081");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter the email for this test payment");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => window.setTimeout(r, 900));
      const reference = `psk_mock_${Date.now()}`;
      await onSuccess(reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-[#0ba4db] px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Paystack · Test mode</p>
          <p className="mt-1 text-lg font-semibold">Pay {naira}</p>
          <p className="text-sm text-white/90">Myalo student plan · {professionalName}</p>
        </div>
        <form onSubmit={(e) => void pay(e)} className="space-y-4 p-5">
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@school.edu.ng"
            />
          </Field>
          <Field label="Card number">
            <TextInput
              value={card}
              onChange={(e) => setCard(e.target.value)}
              required
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry">
              <TextInput value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
            </Field>
            <Field label="CVV">
              <TextInput value={cvv} onChange={(e) => setCvv(e.target.value)} required />
            </Field>
          </div>
          <p className="text-xs leading-5 text-muted">
            Demo only — no real charge. Test card <span className="font-mono">4084084084084081</span>, any
            future expiry, CVV 408.
          </p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" className="cursor-pointer text-sm font-medium text-muted" onClick={onCancel}>
              Cancel
            </button>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Processing…" : `Pay ${naira}`}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
