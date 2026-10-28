"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker, GeoJSONSource } from "maplibre-gl";
import { LocateFixed, Maximize2 } from "lucide-react";
import { starSvg } from "@/components/Stickers";
import { coursePath, mileMarkers, pathBetween, pointAtMile, type LngLat } from "@/lib/geo";
import type { Spot } from "@/data/spots";

export type MapRunner = {
  id: string;
  name: string;
  color: string;
  mile: number | null;
  lo?: number;
  hi?: number;
  // Draw beneath other runners' stars.
  under?: boolean;
};

type Props = {
  runners: MapRunner[];
  spots?: Spot[];
  spotBadges?: Record<string, number>;
  onSpotClick?: (spot: Spot) => void;
  focusId?: string;
  height?: number;
  claimMode?: boolean;
};

const STYLE = "https://tiles.openfreemap.org/styles/positron";

function bounds(points: LngLat[]): [LngLat, LngLat] {
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

const shortName = (name: string) => {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.length > 10 ? `${first.slice(0, 9)}…` : first;
};

const FIT_PADDING = { top: 40, bottom: 50, left: 40, right: 64 };

function safeColor(c: string) {
  return /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#ff3ec8";
}

// Recolour the Positron base map into the sunshine palette.
function paintBase(m: MlMap) {
  const fills: Record<string, string> = {
    background: "#fff7a8",
    water: "#9fdfff",
    park: "#c6f28c",
    landcover_wood: "#c6f28c",
    landuse_residential: "#fff19a",
    building: "#ffe866",
    road_area_pier: "#fff7a8",
    aeroway_area: "#ffffff",
  };
  for (const [id, color] of Object.entries(fills)) {
    if (!m.getLayer(id)) continue;
    m.setPaintProperty(id, id === "background" ? "background-color" : "fill-color", color);
  }
  if (m.getLayer("building")) m.setPaintProperty("building", "fill-outline-color", "#f2d43a");
  for (const layer of m.getStyle().layers ?? []) {
    const id = layer.id;
    if (layer.type === "line") {
      if (id.includes("casing")) m.setPaintProperty(id, "line-color", "#f0d531");
      else if (id.startsWith("highway") || id.startsWith("tunnel") || id.startsWith("road")) m.setPaintProperty(id, "line-color", "#ffffff");
      else if (id.startsWith("railway")) m.setPaintProperty(id, "line-color", id.includes("dash") ? "#fff7a8" : "#f2d43a");
      else if (id.startsWith("waterway")) m.setPaintProperty(id, "line-color", "#9fdfff");
      else if (id.startsWith("boundary")) m.setPaintProperty(id, "line-color", "#c9a900");
    }
    if (layer.type === "symbol") {
      const water = id.startsWith("water");
      m.setPaintProperty(id, "text-color", water ? "#0a6c9c" : id.startsWith("label_") ? "#2a2500" : "#6b5e00");
      m.setPaintProperty(id, "text-halo-color", water ? "#c8efff" : "#fff7a8");
      m.setPaintProperty(id, "text-halo-width", 1.4);
    }
  }
}

export function CourseMap({ runners, spots = [], spotBadges = {}, onSpotClick, focusId, height = 420, claimMode = false }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const runnerMarkers = useRef<Map<string, Marker>>(new Map());
  const spotMarkers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const onSpotClickRef = useRef(onSpotClick);
  onSpotClickRef.current = onSpotClick;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibre = await import("maplibre-gl");
      maplibre.setWorkerUrl("/maplibre-gl-worker.mjs");
      if (cancelled || !container.current) return;
      const m = new maplibre.Map({
        container: container.current,
        style: STYLE,
        bounds: bounds(coursePath),
        fitBoundsOptions: { padding: FIT_PADDING },
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      map.current = m;
      m.on("load", () => {
        paintBase(m);
        m.addSource("course", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coursePath } } });
        m.addLayer({ id: "course-casing", type: "line", source: "course", paint: { "line-color": "#0b0b0b", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 6, 15, 12] }, layout: { "line-join": "round", "line-cap": "round" } });
        m.addLayer({ id: "course", type: "line", source: "course", paint: { "line-color": "#fff200", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.5, 15, 6] }, layout: { "line-join": "round", "line-cap": "round" } });
        m.addSource("band", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "band", type: "line", source: "band", paint: { "line-color": ["get", "color"], "line-width": 16, "line-opacity": 0.4, "line-blur": 1 }, layout: { "line-join": "round", "line-cap": "round" } });
        m.addSource("miles", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: mileMarkers.map((mm) => ({ type: "Feature", properties: { label: String(mm.mile), major: mm.mile % 5 === 0 }, geometry: { type: "Point", coordinates: mm.at } })),
          },
        });
        m.addLayer({
          id: "miles",
          type: "circle",
          source: "miles",
          paint: { "circle-radius": ["case", ["get", "major"], 10, 3], "circle-color": ["case", ["get", "major"], "#0b0b0b", "#ffffff"], "circle-stroke-color": "#0b0b0b", "circle-stroke-width": ["case", ["get", "major"], 2, 1.5] },
        });
        m.addLayer({
          id: "miles-label",
          type: "symbol",
          source: "miles",
          filter: ["get", "major"],
          layout: { "text-field": ["get", "label"], "text-size": 10, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true },
          paint: { "text-color": "#fff200" },
        });
        const endpoint = (label: string, kind: "start" | "finish", at: LngLat) => {
          const el = document.createElement("div");
          el.className = `map-endpoint ${kind}`;
          el.textContent = label;
          const opts = { element: el, anchor: "right" as const, offset: [-12, 0] as [number, number] };
          new maplibre.Marker(opts).setLngLat(at).addTo(m);
        };
        endpoint("start ★", "start", coursePath[0]);
        endpoint("finish!", "finish", coursePath[coursePath.length - 1]);
        setReady(true);
      });
    })();
    const markers = runnerMarkers.current;
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.clear();
    };
  }, []);

  // Spots
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    let cancelled = false;
    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;
      spotMarkers.current.forEach((mk) => mk.remove());
      spotMarkers.current = spots.map((s) => {
        const el = document.createElement("button");
        const count = spotBadges[s.id] ?? 0;
        const tappable = claimMode;
        el.className = tappable ? `map-claim${count > 0 ? " on" : ""}` : "map-spot";
        if (tappable) el.textContent = count > 0 ? String(count) : "+";
        el.title = s.name;
        el.onclick = (e) => {
          e.stopPropagation();
          onSpotClickRef.current?.(s);
        };
        return new maplibre.Marker({ element: el }).setLngLat(pointAtMile((s.mileFrom + s.mileTo) / 2)).addTo(m);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [spots, spotBadges, ready, claimMode]);

  // Runners
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    let cancelled = false;
    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;
      const seen = new Set<string>();
      for (const r of runners) {
        if (r.mile === null) continue;
        seen.add(r.id);
        const at = pointAtMile(r.mile);
        let mk = runnerMarkers.current.get(r.id);
        if (!mk) {
          const el = document.createElement("div");
          const color = safeColor(r.color);
          el.className = "map-runner";
          el.style.zIndex = r.under ? "1" : "2";
          el.style.setProperty("--c", color);
          const star = document.createElement("div");
          star.className = "star";
          star.style.animationDelay = `${(runnerMarkers.current.size * -0.4).toFixed(1)}s`;
          star.innerHTML = starSvg(color);
          const tag = document.createElement("div");
          tag.className = "name";
          tag.textContent = shortName(r.name);
          el.append(star, tag);
          mk = new maplibre.Marker({ element: el, anchor: "top", offset: [0, -17] }).setLngLat(at).addTo(m);
          runnerMarkers.current.set(r.id, mk);
        } else {
          mk.setLngLat(at);
        }
      }
      for (const [id, marker] of runnerMarkers.current) {
        if (!seen.has(id)) {
          marker.remove();
          runnerMarkers.current.delete(id);
        }
      }
      const band = m.getSource("band") as GeoJSONSource | undefined;
      band?.setData({
        type: "FeatureCollection",
        features: runners
          .filter((r) => r.mile !== null && r.lo !== undefined && r.hi !== undefined && (!focusId || r.id === focusId))
          .map((r) => ({ type: "Feature", properties: { color: r.color }, geometry: { type: "LineString", coordinates: pathBetween(r.lo!, r.hi!) } })),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [runners, ready, focusId]);

  const focusRunner = () => {
    const r = runners.find((x) => x.id === focusId) ?? runners.find((x) => x.mile !== null);
    if (!r || r.mile === null || !map.current) return;
    map.current.flyTo({ center: pointAtMile(r.mile), zoom: 14, duration: 900 });
  };
  const fitAll = () => map.current?.fitBounds(bounds(coursePath), { padding: FIT_PADDING, duration: 700 });
  const hasRunner = runners.some((r) => r.mile !== null);

  return (
    <div className="relative overflow-hidden rounded-[28px] border-[2.5px] border-ink bg-sun-soft" style={{ height, isolation: "isolate" }}>
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {hasRunner && (
          <button onClick={focusRunner} className="press rounded-full border-[2.5px] border-ink bg-pink p-2 hover:bg-ink hover:text-sun" aria-label="Center on runner">
            <LocateFixed size={17} strokeWidth={2.4} />
          </button>
        )}
        <button onClick={fitAll} className="press rounded-full border-[2.5px] border-ink bg-paper p-2 hover:bg-ink hover:text-sun" aria-label="Show whole course">
          <Maximize2 size={17} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
