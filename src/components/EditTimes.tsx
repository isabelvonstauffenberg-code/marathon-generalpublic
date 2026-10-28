"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { raceTime, waves } from "@/config/site";
import { MARATHON_MILES } from "@/lib/geo";
import { updateRunnerTimes, type Runner } from "@/lib/store";
import { goalHint, parseGoal } from "@/components/AddRunnerForm";
import { Chip, Field, PrimaryButton, inputClass } from "@/components/ui";

const hm = (sec: number) => {
  const m = Math.round(sec / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};
const startOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" });
const finishOf = (r: Runner) => {
  const banded = Math.abs(r.pace_fast - r.pace_goal * 0.96) <= 1 && Math.abs(r.pace_slow - r.pace_goal * 1.04) <= 1;
  return banded ? hm(r.pace_goal * MARATHON_MILES) : `${hm(r.pace_fast * MARATHON_MILES)}-${hm(r.pace_slow * MARATHON_MILES)}`;
};

export function EditTimes({ runner, code }: { runner: Runner; code: string }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(() => startOf(runner.gun_time));
  const [finish, setFinish] = useState(() => finishOf(runner));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const goal = parseGoal(finish);

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="press display mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-[13px] lowercase">
        <Pencil size={13} strokeWidth={2.6} /> edit times
      </button>
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(start)) return setMsg("pick a start time.");
    if (!goal) return setMsg("goal finish should look like 4:30 or 3:50-4:00.");
    setBusy(true);
    setMsg(null);
    try {
      await updateRunnerTimes(code, runner.slug, { gun_time: new Date(raceTime(start)).toISOString(), pace_fast: goal.fast, pace_goal: goal.goal, pace_slow: goal.slow });
      setOpen(false);
    } catch (err) {
      setMsg(err instanceof Error ? err.message.toLowerCase() : "could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-3 space-y-4 rounded-[24px] border-[2.5px] border-ink bg-paper p-4">
      <div>
        <span className="display mb-2 block text-[16px] lowercase">start time</span>
        <div className="mb-3 flex flex-wrap gap-2">
          {waves.map((w) => (
            <Chip key={w.wave} type="button" on={start === w.time} onClick={() => setStart(w.time)}>
              wave {w.wave}
            </Chip>
          ))}
        </div>
        <input type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} required aria-label="start time" />
      </div>
      <Field label="goal finish time" hint={goalHint(goal)}>
        <input className={inputClass} value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="3:50-4:00" required />
      </Field>
      {msg && <p className="display text-[14px] text-cherry lowercase">{msg}</p>}
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "saving…" : "save"}
        </PrimaryButton>
        <button type="button" onClick={() => setOpen(false)} className="press display rounded-[18px] border-[2.5px] border-ink px-4 text-[15px] lowercase">
          cancel
        </button>
      </div>
    </form>
  );
}
