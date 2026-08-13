import Link from "next/link";
import { SiteFooter } from "@/components/SiteChrome";
import { Logo } from "@/components/Logo";
import { FineWaves } from "@/components/WaveDivider";

export default function CrisisPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="bg-navy text-paper">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-5">
          <Logo inverted />
        </div>
      </header>
      <FineWaves />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
        <p className="text-sm font-semibold text-danger">Crisis resources</p>
        <h1 className="font-display mt-2 text-4xl font-light">
          Myalo is not the right place if you are in crisis.
        </h1>
        <p className="mt-4 leading-7 text-muted">
          If you marked that you are in crisis, matching stops here. Use campus emergency services
          or a local crisis line.
        </p>
        <ul className="mt-8 space-y-4 text-sm leading-6">
          <li className="rounded-xl bg-white p-4 ring-1 ring-line">
            <strong>Campus:</strong> university clinic, campus security, or a resident tutor.
          </li>
          <li className="rounded-xl bg-white p-4 ring-1 ring-line">
            <strong>Nigeria:</strong> SURPIN 0800 038 3838.
          </li>
          <li className="rounded-xl bg-white p-4 ring-1 ring-line">
            <strong>International:</strong>{" "}
            <a className="text-clay underline" href="https://www.iasp.info/suicidalthoughts/" target="_blank" rel="noreferrer">
              IASP local resources
            </a>
            .
          </li>
        </ul>
        <Link href="/" className="mt-8 inline-block font-semibold text-navy">
          Back to Myalo
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
