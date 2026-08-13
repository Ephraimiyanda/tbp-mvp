import { Suspense } from "react";
import { IntakeClient } from "@/components/IntakeClient";
import { FunnelHeader } from "@/components/SiteHeader";

export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-col bg-cream">
          <FunnelHeader progress={0} />
        </div>
      }
    >
      <IntakeClient />
    </Suspense>
  );
}
