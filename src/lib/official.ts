"use client";

import { useEffect, useState } from "react";
import { currentTime, type Sighting } from "@/lib/store";

// NYRR live results run on RTRT.me. This is the unofficial public API their own tracker uses;
// it can change or disappear, so every failure falls back silently to the pace model.
const API = "https://api.rtrt.me";
const APP = "4d7a9ceb0be65b3cc4948ee9";
const EVENT = "NYRR-NY2026";
const RACE_DAY = Date.parse("2026-11-01T00:00:00-04:00");
const POLL_MS = 60_000;

export const MAT_PREFIX = "mat:";
export const isMat = (s: Pick<Sighting, "spot_id">) => s.spot_id.startsWith(MAT_PREFIX);
export const matLabel = (s: Pick<Sighting, "spot_id">) => s.spot_id.slice(MAT_PREFIX.length);

type Point = { name: string; miles: string; label?: string };
type Split = { point: string; epochTime?: string; label?: string };
type Profile = { bib?: string; bib_display?: string; pid?: string; fname?: string; lname?: string };

let tokenReq: Promise<string> | null = null;

function token() {
  tokenReq ??= (async () => {
    const cached = sessionStorage.getItem("rtrt-token");
    if (cached) return cached;
    const res = await fetch(`${API}/register?appid=${APP}`).then((r) => r.json());
    if (!res.token) throw new Error("no token");
    sessionStorage.setItem("rtrt-token", res.token);
    return res.token as string;
  })().catch((e) => {
    tokenReq = null;
    throw e;
  });
  return tokenReq;
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const q = new URLSearchParams({ appid: APP, token: await token(), ...params });
  const res = await fetch(`${API}/events/${EVENT}${path}?${q}`).then((r) => r.json());
  if (res.error) {
    if (String(res.error.type).includes("token")) {
      sessionStorage.removeItem("rtrt-token");
      tokenReq = null;
    }
    throw new Error(res.error.msg ?? "rtrt error");
  }
  return res as T;
}

let pointsReq: Promise<Map<string, Point>> | null = null;

function points() {
  pointsReq ??= get<{ list: Point[] }>("/points", { max: "100" })
    .then(({ list }) => new Map(list.map((p) => [p.name, p])))
    .catch((e) => {
      pointsReq = null;
      throw e;
    });
  return pointsReq;
}

const tidy = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase()) : s);

// Only the bib, pid and name are read; location, team and charity fields are ignored.
async function findProfile(bib: string) {
  const { list = [] } = await get<{ list?: Profile[] }>("/profiles", { search: bib });
  const p = list.find((x) => x.bib === bib || x.bib_display === bib);
  if (!p?.pid) return null;
  sessionStorage.setItem(`rtrt-pid-${bib}`, p.pid);
  return { pid: p.pid, name: tidy([p.fname, p.lname].filter(Boolean).join(" ").trim()) };
}

/** Name registered to a bib in the official tracker, or null if it can't be found. */
export async function lookupBib(bib: string): Promise<string | null> {
  if (!/^[0-9a-z]{1,10}$/i.test(bib)) return null;
  try {
    return (await findProfile(bib))?.name || null;
  } catch {
    return null;
  }
}

async function pidFor(bib: string) {
  return sessionStorage.getItem(`rtrt-pid-${bib}`) ?? (await findProfile(bib))?.pid ?? null;
}

async function matSightings(code: string, slug: string, bib: string, pts: Map<string, Point>): Promise<Sighting[]> {
  const pid = await pidFor(bib);
  if (!pid) return [];
  const { list = [] } = await get<{ list?: Split[] }>(`/profiles/${pid}/splits`, { max: "100" });
  return list.flatMap((s) => {
    const p = pts.get(s.point);
    const mile = Number(p?.miles);
    if (!s.epochTime || !Number.isFinite(mile) || mile < 0) return [];
    const at = new Date(Number(s.epochTime) * 1000).toISOString();
    const label = (p?.label ?? s.label ?? s.point).split("/")[0];
    return [{ id: `mat-${slug}-${s.point}`, group_code: code, runner_slug: slug, spot_id: MAT_PREFIX + label, mile, seen_at: at, name: "official mat times", photo_url: null, created_at: at }];
  });
}

/** Official timing-mat crossings, shaped as sightings so the model treats them as anchors. */
export function useOfficialSightings(code: string | undefined, runners: { slug: string; bib?: string | null }[]) {
  const key = runners
    .filter((r) => r.bib)
    .map((r) => `${r.slug}|${r.bib!.trim()}`)
    .sort()
    .join(",");
  const [rows, setRows] = useState<Sighting[]>([]);

  useEffect(() => {
    if (!code || !key || currentTime().getTime() < RACE_DAY) return;
    let dead = false;
    const pairs = key.split(",").map((p) => p.split("|") as [string, string]);
    const load = async () => {
      try {
        const pts = await points();
        const all = await Promise.all(pairs.map(([slug, bib]) => matSightings(code, slug, bib, pts).catch(() => [])));
        if (!dead) setRows(all.flat());
      } catch {
        // keep the last good set; the pace model covers the gap
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      dead = true;
      clearInterval(id);
    };
  }, [code, key]);

  return rows;
}
