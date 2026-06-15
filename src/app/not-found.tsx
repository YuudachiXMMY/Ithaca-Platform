import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-sm font-medium tracking-[0.2em] text-accent uppercase">
        404
      </p>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Page not found
      </h1>
      <p className="mb-10 max-w-md text-foreground/60">
        The page you are looking for does not exist or has been moved.
        Let us help you find your way back.
      </p>
      <Link
        href="/"
        className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-foreground-dark transition-all duration-300 hover:bg-accent-hover active:scale-[0.97]"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to home
      </Link>
    </section>
  );
}
