import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-forest-dark text-cream/80">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6">
          <p className="font-semibold text-cream">If you are in crisis</p>
          <p className="mt-1">
            TBP is a product prototype, not emergency care. In Nigeria you can contact the
            Suicide Research & Prevention Initiative (SURPIN) on 0800 038 3838, or local
            campus security / a university clinic. Internationally, see{" "}
            <a
              className="text-mint underline"
              href="https://www.iasp.info/suicidalthoughts/"
              target="_blank"
              rel="noreferrer"
            >
              IASP resources
            </a>
            .
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <p>TBP prototype · modeled on BetterHelp’s get-started flow · not affiliated.</p>
          <div className="flex gap-5">
            <Link href="/crisis" className="hover:text-cream">
              Crisis resources
            </Link>
            <Link href="/get-started?path=counseling" className="hover:text-cream">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
