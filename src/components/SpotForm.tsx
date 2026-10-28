"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { spots, spotLabel } from "@/data/spots";
import { firstName } from "@/lib/group";
import { currentTime, insert, rememberName, rememberedName, uploadPhoto } from "@/lib/store";
import { Chip, Field, Honeypot, PrimaryButton, inputClass } from "@/components/ui";
import { Star } from "@/components/Stickers";

const AGO = [0, 2, 5, 10, 15];

export function SpotForm({
  code,
  runners,
  withPhoto = true,
  defaultSpot,
  defaultRunner,
  photoFirst = false,
}: {
  code: string;
  runners: { slug: string; name: string }[];
  defaultRunner?: string;
  withPhoto?: boolean;
  defaultSpot?: string;
  // Arrived via "upload pictures": spotlight the photo picker and open it if the browser allows.
  photoFirst?: boolean;
}) {
  const [who, setWho] = useState<string[]>([]);
  const chosen = runners.filter((r) => who.includes(r.slug));
  const names = (list: { name: string }[]) => list.map((r) => firstName(r.name));
  const runnerName = chosen.length === 1 ? names(chosen)[0] : chosen.length > 1 ? names(chosen).join(" & ") : runners.length === 1 ? names(runners)[0] : "them";
  const toggle = (slug: string) => setWho((w) => (w.includes(slug) ? w.filter((x) => x !== slug) : [...w, slug]));
  useEffect(() => {
    setWho((w) => {
      const valid = w.filter((x) => runners.some((r) => r.slug === x));
      if (valid.length) return valid.length === w.length ? w : valid;
      const first = runners.find((r) => r.slug === defaultRunner) ?? runners[0];
      return first ? [first.slug] : [];
    });
  }, [runners, defaultRunner]);
  const [spotId, setSpotId] = useState(defaultSpot ?? spots[0].id);
  const [ago, setAgo] = useState(0);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const photoButton = useRef<HTMLButtonElement>(null);

  useEffect(() => setName(rememberedName()), []);
  useEffect(() => {
    if (defaultSpot) setSpotId(defaultSpot);
  }, [defaultSpot]);
  useEffect(() => {
    if (!photoFirst || !withPhoto) return;
    photoButton.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    // File pickers need a fresh tap; when we still have one from the home button, open it straight away.
    if (navigator.userActivation?.isActive) fileInput.current?.click();
  }, [photoFirst, withPhoto]);
  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) return;
    const spot = spots.find((s) => s.id === spotId)!;
    setBusy(true);
    setError(null);
    try {
      const photo_url = file ? await uploadPhoto(file, code) : null;
      const seen_at = new Date(currentTime().getTime() - ago * 60_000).toISOString();
      for (const r of chosen) {
        await insert("sightings", { group_code: code, runner_slug: r.slug, spot_id: spot.id, mile: (spot.mileFrom + spot.mileTo) / 2, seen_at, name: name.trim(), photo_url });
      }
      rememberName(name.trim());
      setDone(true);
      setFile(null);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="relative space-y-6">
      {withPhoto && photoFirst && !preview && (
        <p className="stamp display absolute -top-4 left-4 z-10 rounded-full border-2 border-ink bg-lime px-3 py-1 text-[13px] lowercase" style={{ ["--r" as string]: "-5deg" }}>
          start here ↓
        </p>
      )}
      {withPhoto && (
        <button
          ref={photoButton}
          type="button"
          onClick={() => fileInput.current?.click()}
          className={`press group relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-[30px] border-[2.5px] border-ink ${photoFirst ? "sticker bg-pink" : "border-dashed bg-bubble"}`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <span className="relative transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-110">
                <Star size={92} fill="#fff200" strokeWidth={6} />
                <Camera size={26} strokeWidth={2.4} className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </span>
              <span className="display mt-2 px-6 text-center text-[26px] leading-none lowercase">snap {runnerName}</span>
              <span className="tag mt-2 !text-[10.5px]">{photoFirst ? "tap to pick a photo or take one" : "optional, but it makes the feed"}</span>
            </>
          )}
        </button>
      )}
      <input ref={fileInput} type="file" accept="image/*" capture={photoFirst ? undefined : "environment"} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

      {runners.length > 1 && (
        <div>
          <span className="display mb-2 block text-[16px] lowercase">who did you see? tap everyone in the shot.</span>
          <div className="flex flex-wrap gap-2">
            {runners.map((r) => (
              <Chip key={r.slug} on={who.includes(r.slug)} onClick={() => toggle(r.slug)} aria-pressed={who.includes(r.slug)}>
                {r.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <Field label="Where are you?">
        <select className={inputClass} value={spotId} onChange={(e) => setSpotId(e.target.value)}>
          {spots.map((s) => (
            <option key={s.id} value={s.id}>
              {spotLabel(s)} · {s.name}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="display mb-2 block text-[16px] lowercase">when did {runnerName} go past?</span>
        <div className="flex flex-wrap gap-2">
          {AGO.map((m) => (
            <Chip key={m} on={ago === m} onClick={() => setAgo(m)}>
              {m === 0 ? "just now" : `${m} min ago`}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-ink/70 lowercase">be honest. a late post is fine; a wrong time sends everyone to the wrong mile.</p>
      </div>

      <Field label="Your name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required placeholder="so we know who to thank" />
      </Field>
      <Honeypot value={trap} onChange={setTrap} />

      {error && <p className="display text-[14px] text-cherry">{error}</p>}
      <PrimaryButton type="submit" disabled={busy || !name.trim() || chosen.length === 0}>
        {done ? (
          <span className="inline-flex items-center gap-2">
            <Check size={18} strokeWidth={3} /> posted! map updated.
          </span>
        ) : busy ? (
          "posting…"
        ) : (
          `i saw ${runnerName}!`
        )}
      </PrimaryButton>
    </form>
  );
}
