"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/SiteChrome";
import { PrimaryButton } from "@/components/Ui";

function CheckEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email")?.trim() || "";
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((n) => Math.max(0, n - 1));
    }, 1000);
    const go = window.setTimeout(() => {
      router.replace("/login?checkemail=1");
    }, 5000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(go);
    };
  }, [router]);

  return (
    <AuthShell>
      <p className="text-xs font-medium uppercase tracking-wider text-ok">Almost there</p>
      <h1 className="font-display mt-3 text-3xl font-light text-navy">Confirm your email</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        We sent a confirmation link{email ? ` to ${email}` : ""}. Open that email and tap the link to
        finish creating your account before you log in.
      </p>
      <p className="mt-4 text-sm leading-6 text-muted">
        Your questionnaire answers stay in this browser until you sign in.
      </p>
      <p className="mt-6 text-sm text-muted">
        Taking you to log in in {secondsLeft || "a moment"}…
      </p>
      <PrimaryButton
        type="button"
        className="mt-6 w-full"
        onClick={() => router.replace("/login?checkemail=1")}
      >
        Continue to log in
      </PrimaryButton>
      <p className="mt-6 text-sm text-muted">
        Wrong email?{" "}
        <Link href="/signup" className="font-semibold text-navy underline">
          Sign up again
        </Link>
      </p>
    </AuthShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <h1 className="font-display text-3xl font-light text-navy">Confirm your email</h1>
          <p className="mt-3 text-sm text-muted">Loading…</p>
        </AuthShell>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
