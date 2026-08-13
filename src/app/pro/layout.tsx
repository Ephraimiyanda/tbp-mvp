import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");
  if (profile.role !== "professional") redirect("/app");
  if (!profile.consented_at) redirect("/onboarding");

  return (
    <div className="flex min-h-full flex-col">
      <AppNav role="professional" name={profile.full_name} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</div>
    </div>
  );
}
