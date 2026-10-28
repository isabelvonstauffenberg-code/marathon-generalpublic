"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export type Group = { id: string; code: string; name: string; created_at: string };
export type Runner = {
  id: string;
  group_code: string;
  slug: string;
  name: string;
  bib: string | null;
  gun_time: string;
  corral_delay_min: number;
  pace_fast: number;
  pace_goal: number;
  pace_slow: number;
  color: string;
  created_at: string;
};
export type Sighting = {
  id: string;
  group_code: string;
  runner_slug: string;
  spot_id: string;
  mile: number;
  seen_at: string;
  name: string;
  photo_url: string | null;
  created_at: string;
};

type Tables = { groups: Group; runners: Runner; sightings: Sighting };
export type TableName = keyof Tables;
type NewRow<T extends TableName> = Omit<Tables[T], "id" | "created_at">;

const codeColumn = { groups: "code", runners: "group_code", sightings: "group_code" } as const;
const codeOf = <T extends TableName>(table: T, row: NewRow<T>) => String((row as Record<string, unknown>)[codeColumn[table]]);

// Unguessable group codes: 8 characters, no lookalikes (0/o, 1/l/i).
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const isCode = (s: string) => /^[a-z0-9]{6,16}$/.test(s);
export function newCode(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isShared = () => Boolean(url && anonKey);

// One client per group: the code travels as a header, and row-level security only returns that group's rows.
const clients = new Map<string, SupabaseClient>();
function supabase(code: string) {
  if (!url || !anonKey) return null;
  let c = clients.get(code);
  if (!c) {
    c = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: `ftr-${code}` },
      global: { headers: { "x-group-code": code } },
    });
    clients.set(code, c);
  }
  return c;
}

const LOCAL_PREFIX = "ftr:";
const CHANGE_EVENT = "ftr:change";
const localKey = (code: string, table: TableName) => `${LOCAL_PREFIX}${code}:${table}`;

function readLocal<T extends TableName>(table: T, code: string): Tables[T][] {
  try {
    return JSON.parse(localStorage.getItem(localKey(code, table)) ?? "[]");
  } catch {
    return [];
  }
}

export async function list<T extends TableName>(table: T, code: string): Promise<Tables[T][]> {
  if (!isCode(code)) return [];
  const sb = supabase(code);
  if (sb) {
    const { data, error } = await sb.from(table).select("*").eq(codeColumn[table] as string, code).order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return data as Tables[T][];
  }
  return readLocal(table, code).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Tables[T]> {
  const code = codeOf(table, row);
  if (!isCode(code)) throw new Error("That group link looks wrong.");
  const sb = supabase(code);
  if (sb) {
    const { data, error } = await sb.from(table).insert(row as never).select().single();
    if (error) throw error;
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return data as Tables[T];
  }
  const full = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Tables[T];
  localStorage.setItem(localKey(code, table), JSON.stringify([full, ...readLocal(table, code)]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return full;
}

export async function createGroup(name: string): Promise<Group> {
  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      return await insert("groups", { code: newCode(), name: name.trim() });
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not create the group");
}

async function compress(file: File, maxSide = 1280): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read photo"))), "image/jpeg", 0.8));
}

export async function uploadPhoto(file: File, code: string): Promise<string> {
  const blob = await compress(file, isShared() ? 1280 : 640);
  const sb = supabase(code);
  if (sb) {
    const path = `${code}/${crypto.randomUUID()}.jpg`;
    const { error } = await sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useCollection<T extends TableName>(table: T, code: string | undefined, pollMs = 20_000) {
  const [rows, setRows] = useState<Tables[T][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      setRows(await list(table, code));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [table, code]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    const onChange = () => refresh();
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      clearInterval(id);
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh, pollMs]);

  return { rows, loading, error, refresh };
}

// `?at=<ISO time>` shifts the app clock so race day can be previewed.
export function currentTime() {
  if (typeof window === "undefined") return new Date();
  const simulated = new URLSearchParams(window.location.search).get("at");
  const offset = simulated ? new Date(simulated).getTime() - Date.now() : 0;
  return new Date(Date.now() + (Number.isFinite(offset) ? offset : 0));
}

export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(currentTime());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const NAME_KEY = LOCAL_PREFIX + "my-name";
export const rememberedName = () => (typeof window === "undefined" ? "" : localStorage.getItem(NAME_KEY) ?? "");
export const rememberName = (name: string) => localStorage.setItem(NAME_KEY, name);
