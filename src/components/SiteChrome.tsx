import Link from "next/link";
import { Logo } from "./Logo";

export function MarketingHeader() {
  return (
    <header className="bg-navy text-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo inverted />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-paper/80 hover:text-paper">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-clay px-4 py-2 font-semibold text-paper hover:bg-[#b45e3f]"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy text-paper/80">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6">
          <p className="font-semibold text-paper">If you are in crisis</p>
          <p className="mt-1">
            Myalo is not emergency care. Contact campus security, a university clinic, SURPIN
            (0800 038 3838 in Nigeria), or{" "}
            <a className="text-clay-soft underline" href="https://www.iasp.info/suicidalthoughts/" target="_blank" rel="noreferrer">
              IASP resources
            </a>
            .
          </p>
        </div>
        <p className="mt-8 text-sm">Myalo · confidential campus care · not a clinical emergency service.</p>
      </div>
    </footer>
  );
}
