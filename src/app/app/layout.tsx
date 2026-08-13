import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
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
  if (!profile) redirect("/get-started");
  if (profile.role === "professional") redirect("/pro");
  if (!profile.consented_at) redirect("/get-started");

  return (
    <div className="flex min-h-full flex-col">
      <AppNav role="student" name={profile.chosen_name || profile.full_name} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</div>
    </div>
  );
}
