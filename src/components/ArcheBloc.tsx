"use client";

import Link from "next/link";
import { Scale, ShieldCheck, Sun } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const EMBLEMES = { or: Sun, emeraude: ShieldCheck, amethyste: Scale } as const;

export type Accent = keyof typeof EMBLEMES;

type Props = {
  href: string;
  titre: string;
  description: string;
  accent: Accent;
  pied: string;
};

/** Une « porte » vers l'un des trois blocs. Elle s'incline légèrement vers le pointeur. */
export function ArcheBloc({ href, titre, description, accent, pied }: Props) {
  const sansMouvement = useReducedMotion();
  const inclinaisonX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const inclinaisonY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const Embleme = EMBLEMES[accent];

  function suivre(evenement: React.PointerEvent<HTMLDivElement>) {
    if (sansMouvement || evenement.pointerType !== "mouse") return;
    const cadre = evenement.currentTarget.getBoundingClientRect();
    const x = (evenement.clientX - cadre.left) / cadre.width - 0.5;
    const y = (evenement.clientY - cadre.top) / cadre.height - 0.5;
    inclinaisonY.set(x * 7);
    inclinaisonX.set(-y * 5);
  }

  function relacher() {
    inclinaisonX.set(0);
    inclinaisonY.set(0);
  }

  return (
    <motion.div
      data-accent={accent}
      className="h-full"
      style={{ rotateX: inclinaisonX, rotateY: inclinaisonY, transformPerspective: 1100 }}
      onPointerMove={suivre}
      onPointerLeave={relacher}
    >
      <Link href={href} className="arche">
        <span className="arche-embleme">
          <Embleme className="size-8" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h2 className="mt-8 text-[1.75rem] font-bold md:text-[2rem]">{titre}</h2>
        <p className="mt-4 max-w-[26ch] text-encre-douce">{description}</p>
        <span className="mt-auto pt-8 text-sm font-semibold text-accent">{pied}</span>
      </Link>
    </motion.div>
  );
}
