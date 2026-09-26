import Link from "next/link";

export default function AuthPageShell({
  children,
  backHref = "/",
  backLabel = "← Back to home",
}: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="landing-auth-page relative flex min-h-full items-center justify-center px-4 py-16">
      <Link
        href={backHref}
        className="absolute left-4 top-4 text-sm text-stone-400 transition-colors hover:text-stone-200 sm:left-6 sm:top-6"
      >
        {backLabel}
      </Link>
      {children}
    </main>
  );
}
