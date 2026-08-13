import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="calm-wash flex min-h-full flex-col items-center justify-center px-5">
      <Logo />
      <h1 className="font-display mt-8 text-3xl font-light">That page isn’t here.</h1>
      <Link href="/" className="mt-4 cursor-pointer text-sm font-semibold text-navy">
        Back to Myalo
      </Link>
    </div>
  );
}
