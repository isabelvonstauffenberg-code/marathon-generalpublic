"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import type { RunnerProfile } from "@/lib/model";
import { isShared, useCollection, type Runner, type Sighting } from "@/lib/store";
import { useOfficialSightings } from "@/lib/official";

export const toProfile = (r: Runner): RunnerProfile => ({
  slug: r.slug,
  name: r.name,
  bib: r.bib ?? undefined,
  gunTime: r.gun_time,
  corralDelayMin: r.corral_delay_min,
  pace: { fast: r.pace_fast, goal: r.pace_goal, slow: r.pace_slow },
  color: r.color,
});

export const toAnchors = (sightings: Sighting[]) => sightings.map((s) => ({ mile: Number(s.mile), seenAt: s.seen_at }));
export const sightingsFor = (all: Sighting[], slug: string) => all.filter((s) => s.runner_slug === slug);
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export const groupPath = (code: string, sub = "") => `/g/${code}${sub}`;

export const useCode = () => useParams<{ code: string }>().code?.toLowerCase();

/** Everything a group page needs: the group, its runners, and sightings plus official mat times. */
export function useGroup(code: string | undefined) {
  const groups = useCollection("groups", code, 120_000);
  const runners = useCollection("runners", code);
  const sightings = useCollection("sightings", code);
  const official = useOfficialSightings(code, runners.rows);
  const group = groups.rows[0] ?? null;
  const profiles = useMemo(() => [...runners.rows].reverse().map(toProfile), [runners.rows]);
  const allSightings = useMemo(() => [...sightings.rows, ...official], [sightings.rows, official]);
  const loading = groups.loading || runners.loading;
  // Without shared storage a group made on another device isn't here; still let people use it locally.
  const missing = !loading && !group && isShared();
  return {
    group,
    name: group?.name ?? (loading ? "" : "this group"),
    runners: runners.rows,
    profiles,
    posts: sightings.rows,
    sightings: allSightings,
    loading,
    missing,
  };
}

const RECENT_KEY = "ftr-recent-groups";
export type RecentGroup = { code: string; name: string; at: number };

export function recentGroups(): RecentGroup[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberGroup(code: string, name: string) {
  const rest = recentGroups().filter((g) => g.code !== code);
  localStorage.setItem(RECENT_KEY, JSON.stringify([{ code, name, at: Date.now() }, ...rest].slice(0, 8)));
}
