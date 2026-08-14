"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton, CareTabs } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { PaystackMockCheckout } from "@/components/PaystackMockCheckout";
import { Card, PrimaryButton } from "@/components/Ui";
import { DEMO_PLAN_AMOUNT_KOBO } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import { concernLabel, initials, planForConcerns, type Intake, type Professional } from "@/lib/types";

export default function SubscribePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pro, setPro] = useState<Professional | null>(null);
  const [plan, setPlan] = useState<ReturnType<typeof planForConcerns> | null>(null);
  const [communication, setCommunication] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      // Keep subscribe reachable for the open proposal; only bounce if already paid.
      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("id, professional_id")
        .eq("student_id", auth.user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (activeSub) {
        router.replace("/app");
        return;
      }

      const res = await fetch(`/api/directory/${id}`);
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        professional?: Professional;
      };
      if (!res.ok || !json.professional) {
        setError(json.error || "Professional not found");
        return;
      }
      setPro(json.professional);
      const { data: intake } = await supabase
        .from("intakes")
        .select("*")
        .eq("student_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (intake) {
        const row = intake as Intake;
        setPlan(planForConcerns(row.concerns));
        setCommunication(row.communication);
      }
    })();
  }, [id, router]);

  async function completePayment(reference: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_id: id,
          reference,
          amount_kobo: DEMO_PLAN_AMOUNT_KOBO,
        }),
      });
      const json = (await res.json()) as { error?: string; modality?: string };
      if (!res.ok) throw new Error(json.error || "Could not complete payment");
      router.replace(`/app?paid=1&modality=${json.modality ?? "video"}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete payment");
      setBusy(false);
      setCheckoutOpen(false);
    }
  }

  async function seeSomeoneElse() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user && id) {
      await supabase.from("matches").upsert(
        {
          student_id: auth.user.id,
          professional_id: id,
          status: "declined",
          reasons: [],
        },
        { onConflict: "student_id,professional_id" },
      );
    }
    router.replace("/app/match");
  }

  if (error && !pro) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <BackButton href="/app" label="Home" />
        <p className="text-danger">{error}</p>
      </div>
    );
  }
  if (!pro || !plan) return <PageLoading label="Loading programme…" />;
  const name = pro.profiles?.full_name ?? "Professional";
  const naira = (DEMO_PLAN_AMOUNT_KOBO / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
  const sessionKind =
    communication === "message"
      ? "Secure chat sessions"
      : communication === "mix"
        ? "Mix of chat and video"
        : "Google Meet video sessions";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/app" label="Home" />
        <CareTabs />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Start care</p>
        <h1 className="font-display mt-2 text-4xl font-light">Pay to begin this programme</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          After a successful payment, {name.split(" ")[0]} is reserved for you, your first session is
          scheduled, and their nuggets unlock. This demo uses Paystack test mode — no real charge.
        </p>
      </div>
      <Card className="p-6">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-display text-lg text-paper">
            {initials(name)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{name}</p>
            <p className="text-sm text-muted">{pro.credentials}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Focus</dt>
            <dd className="mt-1 font-medium">{concernLabel(plan.issue)}</dd>
          </div>
          <div>
            <dt className="text-muted">Length</dt>
            <dd className="mt-1 font-medium">
              {plan.weeks} weeks · {plan.sessions} sessions
            </dd>
          </div>
          <div>
            <dt className="text-muted">Format</dt>
            <dd className="mt-1 font-medium">{sessionKind}</dd>
          </div>
          <div>
            <dt className="text-muted">Student plan</dt>
            <dd className="mt-1 font-medium">{naira}</dd>
          </div>
        </dl>
      </Card>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => void seeSomeoneElse()}
          className="cursor-pointer text-sm font-medium text-muted hover:text-navy"
        >
          See someone else
        </button>
        <PrimaryButton onClick={() => setCheckoutOpen(true)} disabled={busy}>
          {busy ? "Confirming…" : `Pay ${naira} with Paystack`}
        </PrimaryButton>
      </div>
      {checkoutOpen ? (
        <PaystackMockCheckout
          professionalName={name}
          onCancel={() => setCheckoutOpen(false)}
          onSuccess={completePayment}
        />
      ) : null}
    </div>
  );
}
