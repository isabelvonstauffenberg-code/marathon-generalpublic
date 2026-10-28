"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { raceTime, waves } from "@/config/site";
import { MARATHON_MILES } from "@/lib/geo";
import { fmtPace } from "@/lib/model";
import { lookupBib } from "@/lib/official";
import { insert, type Runner } from "@/lib/store";
import { groupPath } from "@/lib/group";
import { Chip, Field, Honeypot, PrimaryButton, inputClass } from "@/components/ui";
import { Star } from "@/components/Stickers";

export const STAR_COLORS = ["#ff3ec8", "#22b5ff", "#3ee04f", "#ffffff", "#ff8a1f", "#b98cff", "#ff5a5a", "#00d6c4"];
const CORRAL_DELAY_MIN = 5;

// "4:30", "4:30:00", "430" → seconds.
export function parseFinish(input: string): number | null {
  const t = input.trim();
  let h: number, m: number, s = 0;
  const parts = t.split(":");
  if (parts.length >= 2) {
    [h, m] = [Number(parts[0]), Number(parts[1])];
    if (parts.length === 3) s = Number(parts[2]);
    if (parts.length > 3) return null;
  } else {
    const d = t.replace(/\D/g, "");
    if (d.length !== 3) return null;
    [h, m] = [Number(d[0]), Number(d.slice(1))];
  }
  if (![h, m, s].every(Number.isInteger) || m > 59 || s > 59) return null;
  const total = h * 3600 + m * 60 + s;
  return total >= 2 * 3600 && total <= 9 * 3600 ? total : null;
}

// "4:30" → ±4% band around it; "3:50-4:00" or "3:50-4" → that range, goal in the middle. Seconds per mile.
export function parseGoal(input: string): { fast: number; goal: number; slow: number } | null {
  const parts = input.split(/\s*(?:-|–|—|to)\s*/).filter(Boolean);
  const read = (p: string) => (/^\d$/.test(p.trim()) ? Number(p) * 3600 : parseFinish(p));
  if (parts.length === 1) {
    const t = read(parts[0]);
    if (!t || t < 2 * 3600) return null;
    const goal = t / MARATHON_MILES;
    return { fast: Math.round(goal * 0.96), goal: Math.round(goal), slow: Math.round(goal * 1.04) };
  }
  if (parts.length !== 2) return null;
  const [a, b] = parts.map(read);
  if (!a || !b || a < 2 * 3600 || b > 9 * 3600) return null;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return { fast: Math.round(lo / MARATHON_MILES), goal: Math.round((lo + hi) / 2 / MARATHON_MILES), slow: Math.round(hi / MARATHON_MILES) };
}

export const goalHint = (g: ReturnType<typeof parseGoal>) =>
  g ? `about ${fmtPace(g.goal)}/mi${g.slow / g.fast > 1.09 || g.slow / g.fast < 1.07 ? `, ${fmtPace(g.fast)}–${fmtPace(g.slow)}/mi range` : ". stars run a ±4% band around it"}.` : "hours:minutes, e.g. 4:30, or a range like 3:50-4:00";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "runner";

function uniqueSlug(name: string, taken: string[]) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; taken.includes(slug); i++) slug = `${base}-${i}`;
  return slug;
}

type Lookup = { state: "idle" | "looking" | "found" | "none"; bib: string };

export function AddRunnerForm({ code, existing }: { code: string; existing: Runner[] }) {
  const router = useRouter();
  const [bib, setBib] = useState("");
  const [name, setName] = useState("");
  const [autoName, setAutoName] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Lookup>({ state: "idle", bib: "" });
  const [start, setStart] = useState("");
  const [finish, setFinish] = useState("");
  const used = existing.map((r) => r.color);
  const [color, setColor] = useState<string | null>(null);
  const colour = color ?? STAR_COLORS.find((c) => !used.includes(c)) ?? STAR_COLORS[existing.length % STAR_COLORS.length];
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalPace = parseGoal(finish);
  const cleanBib = bib.trim();

  const findName = async () => {
    if (!cleanBib || lookup.bib === cleanBib) return name;
    setLookup({ state: "looking", bib: cleanBib });
    const found = await lookupBib(cleanBib);
    setLookup({ state: found ? "found" : "none", bib: cleanBib });
    // Only replace a name the lookup filled in, never one someone typed.
    if (found && (!name.trim() || name === autoName)) {
      setName(found);
      setAutoName(found);
      return found;
    }
    return name;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) return;
    setError(null);
    const finalName = (await findName()).trim();
    if (!finalName) return setError("Add a name so people know whose star it is.");
    if (!/^\d{2}:\d{2}$/.test(start)) return setError("Pick a start time.");
    if (!goalPace) return setError("Goal finish should look like 4:30 or 3:50-4:00.");
    setBusy(true);
    try {
      await insert("runners", {
        group_code: code,
        slug: uniqueSlug(finalName, existing.map((r) => r.slug)),
        name: finalName.slice(0, 40),
        bib: cleanBib || null,
        gun_time: new Date(raceTime(start)).toISOString(),
        corral_delay_min: CORRAL_DELAY_MIN,
        pace_fast: goalPace.fast,
        pace_goal: goalPace.goal,
        pace_slow: goalPace.slow,
        color: colour,
      });
      router.push(groupPath(code) + window.location.search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  const hint =
    lookup.state === "looking"
      ? "looking up the bib in the official tracker…"
      : lookup.state === "found"
        ? "name filled in from the official tracker. edit it if you like."
        : lookup.state === "none"
          ? "couldn't find that bib (the tracker can be patchy before race day). type a name."
          : "we'll try to fill in the name from the official tracker. leave blank if you don't know it.";

  return (
    <form onSubmit={submit} className="relative space-y-6">
      <Field label="bib number" hint={hint}>
        <input
          className={inputClass}
          value={bib}
          onChange={(e) => setBib(e.target.value.replace(/[^0-9a-z]/gi, "").slice(0, 10))}
          onBlur={() => void findName()}
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 12345"
          autoFocus
        />
      </Field>

      <Field label="name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="what's on their shirt" />
      </Field>

      <div>
        <span className="display mb-2 block text-[16px] lowercase">start time</span>
        <div className="mb-3 flex flex-wrap gap-2">
          {waves.map((w) => (
            <Chip key={w.wave} on={start === w.time} onClick={() => setStart(w.time)}>
              wave {w.wave} · {Number(w.time.slice(0, 2)) > 12 ? Number(w.time.slice(0, 2)) - 12 : Number(w.time.slice(0, 2))}:{w.time.slice(3)}
            </Chip>
          ))}
        </div>
        <input type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} required aria-label="start time" />
        <span className="mt-2 block text-[11.5px] leading-snug text-ink/65 lowercase">
          wave times from nyrr.org (subject to change). the wave is on their confirmation or in the official app. not sure? ask them, a wrong wave throws every estimate off.
        </span>
      </div>

      <Field label="goal finish time" hint={goalHint(goalPace)}>
        <input className={inputClass} value={finish} onChange={(e) => setFinish(e.target.value)} inputMode="numeric" placeholder="4:30" required />
      </Field>

      <div>
        <span className="display mb-2 block text-[16px] lowercase">star colour</span>
        <div className="flex flex-wrap gap-2">
          {STAR_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`colour ${c}`} aria-pressed={colour === c} className={`press rounded-full border-[2.5px] p-1 ${colour === c ? "border-ink bg-paper" : "border-transparent"}`}>
              <Star size={36} fill={c} strokeWidth={7} />
            </button>
          ))}
        </div>
      </div>
      <Honeypot value={trap} onChange={setTrap} />

      {error && <p className="display text-[14px] text-cherry lowercase">{error}</p>}
      <PrimaryButton type="submit" disabled={busy || lookup.state === "looking"}>
        {busy ? "adding…" : `add ${name.trim() ? name.trim().split(/\s+/)[0] : "runner"}`}
      </PrimaryButton>
    </form>
  );
}
