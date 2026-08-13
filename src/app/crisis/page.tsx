import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo } from "@/components/Logo";

export default function CrisisPage() {
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <header className="border-b border-line bg-cream">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-5">
          <Logo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
        <p className="text-sm font-semibold text-danger">Crisis resources</p>
        <h1 className="font-display mt-2 text-4xl font-light">
          TBP is not the right place if you are in crisis.
        </h1>
        <p className="mt-4 leading-7 text-muted">
          BetterHelp says the same thing in its FAQ. A campus product has to say it earlier, and
          louder. If you marked “I’m in crisis right now,” we stop matching and send you here.
        </p>
        <ul className="mt-8 space-y-4 text-sm leading-6">
          <li className="rounded-xl bg-white p-4 ring-1 ring-line">
            <strong>Campus:</strong> university clinic, campus security, or a resident tutor —
            use the numbers posted in your hall.
          </li>
          <li className="rounded-xl bg-white p-4 ring-1 ring-line">
            <strong>Nigeria:</strong> SURPIN 0800 038 3838.
          </li>
          <li className="rounded-xl bg-white p-4 ring-1 ring-line">
            <strong>International:</strong>{" "}
            <a
              className="text-leaf-deep underline"
              href="https://www.iasp.info/suicidalthoughts/"
              target="_blank"
              rel="noreferrer"
            >
              IASP local resources
            </a>
            .
          </li>
        </ul>
        <p className="mt-8 text-sm text-muted">
          If you are safe and still want to explore the prototype, you can go back and uncheck that
          option.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/get-started?path=counseling" className="font-semibold text-leaf-deep">
            Return to intake
          </Link>
          <Link href="/" className="text-muted">
            Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
