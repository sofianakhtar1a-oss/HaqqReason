import Link from "next/link";

/** Le sceau à huit branches et le nom HaqqReason. */
export function Sceau({ taille = 28 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <rect x="-7.5" y="-7.5" width="15" height="15" />
      <rect x="-7.5" y="-7.5" width="15" height="15" transform="rotate(45)" />
      <circle r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
      <span className="text-or">
        <Sceau />
      </span>
      HaqqReason
    </Link>
  );
}
