# find the runners

A spectator site for the 2026 TCS New York City Marathon (Sunday, November 1, 2026). Start a group, add runners by bib, share one link: everyone sees the same stars on the course map, the same cheer-spot windows, and the same photo feed.

Without a database it runs in **preview mode**: everything stays on the device that added it. Connect Supabase (steps 4–6) so a shared link shows the same runners to everyone.

## Put it online

1. **Make a GitHub repo.** On github.com, click **New repository**, give it a name, create it.
2. **Upload the files.** On the new repo's page, click **uploading an existing file**, drag in everything *inside* this folder (not the folder itself), and click **Commit changes**.
3. **Import into Vercel.** On vercel.com, click **Add New → Project**, pick the repo, and click **Deploy**. Defaults are fine.
4. **Add Supabase.** In the Vercel project, open **Storage** (or **Integrations**) and add **Supabase**, connected to this project. It sets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) for you. Check they're there under **Settings → Environment Variables**.
5. **Create the tables.** Open the Supabase dashboard (Vercel links to it), go to **SQL Editor**, paste in all of `supabase/schema.sql`, and click **Run**.
6. **Redeploy.** In Vercel, **Deployments → ⋯ → Redeploy**. The preview-mode note disappears once it's connected.

## Good to know

- **Group links are the only key.** Anyone with a link can view the group and add runners or photos. Nothing can be edited or deleted from the site; remove rows in the Supabase dashboard if needed.
- **Official mat times** come from the unofficial API behind the NYRR live tracker (RTRT.me). It's best-effort: if it's unavailable, stars fall back to the pace model and sightings. Only the runner's name is read from a bib lookup.
- **Wave start times** are from nyrr.org/tcsnycmarathon/the-start and live in `src/config/site.ts`.
- **Search engines** are blocked by `public/robots.txt`. Delete that file when you want the site to be findable.
- **Preview race day:** add `?at=2026-11-01T13:00:00-05:00` to any URL.

## For developers

`npm ci && npm run dev`. Next.js 15, Tailwind v4, MapLibre with OpenFreeMap tiles, Supabase with a localStorage fallback (`src/lib/store.ts`).
