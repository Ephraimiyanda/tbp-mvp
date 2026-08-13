import { redirect } from "next/navigation";

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  redirect(params.intent === "peer" ? "/signup?intent=peer" : "/signup");
}
