"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "@/components/Stickers";

const tabs = [
  { sub: "", label: "live" },
  { sub: "/stand", label: "stand" },
  { sub: "/spotted", label: "spotted" },
  { sub: "/add", label: "add" },
  { sub: "/sign", label: "signs" },
];

// Group pages only; the landing page has nothing to navigate between.
export function TabBar() {
  const path = usePathname();
  const m = path.match(/^\/g\/([a-z0-9]+)(\/.*)?$/);
  if (!m) return null;
  const base = `/g/${m[1]}`;
  const rest = m[2] ?? "";
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pb-safe">
      <div className="mx-auto flex max-w-md items-stretch gap-0.5 rounded-full border-[2.5px] border-ink bg-ink p-1.5 shadow-[0_0_0_3px_var(--sun)]">
        {tabs.map(({ sub, label }) => {
          const active = sub === "" ? rest === "" || rest.startsWith("/r/") : rest.startsWith(sub);
          return (
            <Link
              key={label}
              href={base + sub}
              aria-current={active ? "page" : undefined}
              className={`press relative flex flex-1 items-center justify-center rounded-full py-2.5 display text-[14px] tracking-[-0.02em] ${active ? "bg-sun text-ink" : "text-paper/70 hover:text-paper"}`}
            >
              {active && <Star size={18} fill="#ff3ec8" strokeWidth={8} className="stamp absolute -top-2.5 -right-1" style={{ ["--r" as string]: "14deg" }} />}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
