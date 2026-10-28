import courseData from "@/data/course.json";

export type LngLat = [number, number];

export const MARATHON_MILES = 26.2188;

const R_MILES = 3958.8;

function haversine(a: LngLat, b: LngLat) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.sqrt(h));
}

export const coursePath = courseData.coordinates as LngLat[];

const rawCumulative = coursePath.reduce<number[]>((acc, p, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + haversine(coursePath[i - 1], p));
  return acc;
}, []);

// The traced line is a little longer than the certified distance; scale it so mile 26.2 lands on the finish.
const scale = MARATHON_MILES / rawCumulative[rawCumulative.length - 1];
const cumulative = rawCumulative.map((d) => d * scale);

export function pointAtMile(mile: number): LngLat {
  const m = Math.min(Math.max(mile, 0), MARATHON_MILES);
  let i = cumulative.findIndex((d) => d >= m);
  if (i <= 0) return coursePath[0];
  if (i === -1) i = cumulative.length - 1;
  const [d0, d1] = [cumulative[i - 1], cumulative[i]];
  const t = d1 === d0 ? 0 : (m - d0) / (d1 - d0);
  const [a, b] = [coursePath[i - 1], coursePath[i]];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function pathBetween(fromMile: number, toMile: number): LngLat[] {
  const lo = Math.max(0, Math.min(fromMile, toMile));
  const hi = Math.min(MARATHON_MILES, Math.max(fromMile, toMile));
  const inner = coursePath.filter((_, i) => cumulative[i] > lo && cumulative[i] < hi);
  return [pointAtMile(lo), ...inner, pointAtMile(hi)];
}

export const mileMarkers = Array.from({ length: 26 }, (_, i) => ({ mile: i + 1, at: pointAtMile(i + 1) }));
