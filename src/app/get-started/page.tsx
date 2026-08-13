import { Suspense } from "react";
import { GetStartedClient } from "@/components/GetStartedClient";
import { Logo } from "@/components/Logo";

export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-col bg-paper">
          <header className="border-b border-line">
            <div className="mx-auto flex h-14 max-w-3xl items-center px-5">
              <Logo />
            </div>
          </header>
        </div>
      }
    >
      <GetStartedClient />
    </Suspense>
  );
}
