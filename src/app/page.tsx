"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/config/site";
import { createGroup, isCode } from "@/lib/store";
import { Field, Honeypot, PrimaryButton, Wordmark, inputClass } from "@/components/ui";
import { Hi, SpinBadge, Star } from "@/components/Stickers";

function codeFrom(input: string) {
  const t = input.trim().toLowerCase();
  const m = t.match(/\/g\/([a-z0-9]+)/);
  const code = m ? m[1] : t;
  return isCode(code) ? code : null;
}

const STEPS = [
  { n: "1", title: "start a group", body: "name it after your crew. you get a private link.", color: "#ff3ec8" },
  { n: "2", title: "add runners by bib", body: "we fill in the name from the official tracker. pick their wave and goal time.", color: "#22b5ff" },
  { n: "3", title: "share the link", body: "everyone sees the same stars, the same cheer windows, the same photos.", color: "#3ee04f" },
];

export default function Landing() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const g = await createGroup(name.trim().slice(0, 60));
      router.push(`/g/${g.code}${window.location.search}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the group");
      setBusy(false);
    }
  };

  const open = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeFrom(link);
    if (!code) return setLinkError(true);
    router.push(`/g/${code}${window.location.search}`);
  };

  return (
    <main>
      <header className="rise relative px-5 pt-5 pb-8">
        <Wordmark />
        <SpinBadge text="nyc marathon · sun nov 1 · " className="absolute top-14 right-3" />
        <h1 className="display mt-12 text-[60px] leading-[0.9] lowercase">
          find
          <br />
          the <Hi tone="pink">runners</Hi>
        </h1>
        <p className="mt-6 max-w-[32ch] text-[14px] leading-[1.6] lowercase">{site.tagline}</p>
      </header>

      <section className="px-5">
        <form onSubmit={start} className="sticker relative rounded-[30px] bg-paper p-5">
          <Star size={48} fill="#3ee04f" strokeWidth={7} className="absolute -top-5 -right-3 rotate-12" />
          <Field label="name your group">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="maya's cheer squad" required />
          </Field>
          <Honeypot value={trap} onChange={setTrap} />
          {error && <p className="display mt-3 text-[14px] text-cherry lowercase">{error}</p>}
          <PrimaryButton type="submit" disabled={busy || !name.trim()} className="mt-5">
            {busy ? "starting…" : "start a group"}
          </PrimaryButton>
          <p className="mt-3 text-[11.5px] leading-snug text-ink/65 lowercase">no sign-up. anyone with the link can follow along and add runners or photos.</p>
        </form>
      </section>

      <section className="mt-8 px-5">
        <form onSubmit={open} className="rounded-[26px] border-[2.5px] border-dashed border-ink bg-sun-soft p-4">
          <Field label="have a link? paste it">
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setLinkError(false);
                }}
                placeholder="…/g/abcd2345"
                autoComplete="off"
              />
              <button type="submit" className="press display shrink-0 rounded-[18px] border-[2.5px] border-ink bg-ink px-4 text-[16px] text-sun lowercase hover:bg-pink hover:text-ink">
                go
              </button>
            </div>
          </Field>
          {linkError && <p className="display mt-2 text-[13px] text-cherry lowercase">that doesn&apos;t look like a group link.</p>}
        </form>
      </section>

      <section className="mt-12 px-5">
        <ol className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex items-start gap-4 rounded-[26px] border-[2.5px] border-ink bg-paper p-4">
              <span className="relative shrink-0">
                <Star size={52} fill={s.color} strokeWidth={7} />
                <span className="display absolute inset-0 flex items-center justify-center pt-1 text-[18px]">{s.n}</span>
              </span>
              <span>
                <span className="display block text-[20px] leading-none lowercase">{s.title}</span>
                <span className="mt-1.5 block text-[12.5px] leading-[1.5] lowercase">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-[11px] leading-[1.6] text-ink/70 lowercase">
          not affiliated with nyrr. estimates come from pace plus official mat times when available.
        </p>
      </section>
    </main>
  );
}
