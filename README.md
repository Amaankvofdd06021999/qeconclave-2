# QE Conclave 2026 — Quality, Unbound

A complete event website redesign: restrained typography, open asymmetric layouts, dark and light sections, a pointer-responsive Three.js pixel field, and scroll-driven motion.

## Run locally

Requires Node.js 22.13 or newer and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev          # Next.js dev server on http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
```

Form submissions need a Postgres database. Copy `.env.example` to `.env.local` and set `DATABASE_URL`; the `submissions` table is created automatically on the first submission. Without it, the site works and the forms show a friendly "couldn't save" message.

## Deploy to Vercel

1. Import this repository in Vercel. `vercel.json` sets the framework (Next.js), the pnpm install command and the build command, so no settings need changing.
2. Add a Postgres database: in the project, open **Storage → Create Database → Neon** (or connect Supabase / any Postgres) and make sure `DATABASE_URL` is set for Production and Preview.
3. Deploy. Every route except `/api/submissions` and `/editions/[year]` is pre-rendered as static HTML.

Submissions are stored in the `submissions` table (id, kind, name, email, company, job_title, phone, message, talk_title, profile, consent, created_at) and can be read from the database provider's console.

The original Cloudflare/vinext tooling is still available as `pnpm dev:cloudflare` and `pnpm build:cloudflare`, but form storage now targets Postgres.

## Pages

| Route | Experience |
| --- | --- |
| `/` | Event, tracks, alumni, challenge, agenda, partners, venue and FAQ |
| `/about` | Purpose, community and six AI / quality engineering themes |
| `/speakers` | Searchable alumni and edition filters |
| `/schedule` | Filterable programme preview, calendar download and print view |
| `/partners` | Partnership options and past partners |
| `/editions` | Past-event index |
| `/editions/2023`, `/editions/2024`, `/editions/2025` | Edition-specific speakers, recordings and available photography |
| `/register` | Free registration request |
| `/speak` | Speaking proposal |
| `/partner` | Partnership enquiry |
| `/challenge` | Daily anomaly game, practice, share links and PNG scorecards |
| `/privacy-policy` | Existing event privacy policy |

Unknown routes render a custom 404 page.

## Editing

- `components/qe/home.tsx`: home page.
- `components/qe/pages.tsx`: editorial pages and archives.
- `components/qe/data.ts`, `lib/content.json`: event and archive content.
- `components/qe/brand.tsx`: SVG burst mark (official logo colours) and the first-visit loading intro.
- `components/qe/sponsors.tsx`: 2026 partner tiers and past-partner marquee.
- `components/qe/hero-bg/`: home hero background (columns style) and its React wrapper.
- `components/qe/motion.tsx`: GSAP scroll animation.
- `components/qe/challenge.tsx`: deterministic game and social scorecard.
- `components/qe/forms.tsx`, `app/api/submissions/route.ts`: forms and validation.
- `app/globals.css`: visual system and responsive layouts.
- `public/media`: optimized, self-hosted assets, including the supplied video.
- `db/schema.ts`, `drizzle/`: form schema and migrations.

## Content status

The published event site and supplied repository were used as sources. The event is 11 December 2026 at HICC, Hyderabad. The original repository explicitly labels its 2026 speakers as placeholders; those names are not presented as a confirmed lineup. Speakers shown here are clearly labelled alumni. Session topics from the source are retained as a provisional programme and require organiser confirmation. Past partner logos are labelled as past partners.

Edition galleries (2023: 20 photos, 2024: 12, 2025: 25) were sourced from each edition’s archive on qeconclave.com and re-encoded to WebP in `public/media/archive-*.webp`. The event privacy-policy text is retained in `lib/privacy.json`.

2026 partner tiers live in `components/qe/data.ts` (`sponsorTiers`). Add a confirmed partner by appending `{name, logo, url}` to its tier; logos go in `public/media/<logo>.webp`. Unfilled slots render as “Your logo here” links to `/partner`.

Media filenames are lowercase. Cloudflare asset paths are case-sensitive, so keep references lowercase too.

## Forms and privacy

Registration, speaker proposals and partnership enquiries are validated on the server and stored in Postgres (`DATABASE_URL`). Explicit consent, a honeypot and UUID idempotency are included. There is no public endpoint that lists submissions. WebMCP preparation tools, when supported, only fill fields for review; they never submit or accept consent.

**Email delivery and attendance approval are not connected.** Submission success means the details were stored, not that an event pass was issued. The interface states this clearly and provides the organiser email. Before a public launch, connect the team’s notification/CRM workflow and approval process. No test registrations or database files are included in the repository.

## Challenge and motion

UI transitions follow the [transitions.dev](https://transitions.dev) skill. Its motion tokens (`--duration-*`, `--ease-*`, …) and recipes sit in a marked block in `app/globals.css`. Recipes in use: accordion (FAQ), modal (all dialogs, as keyframes because Radix waits for animations), sliding tabs (`components/qe/sliding-tabs.tsx`), texts reveal (hero copy, after the loader), error-state shake (form fields), success check (form confirmation) and checkbox check (consent). Each recipe keeps its `prefers-reduced-motion` guard. The home stats count up when scrolled into view, and the hero countdown shows days, hours and minutes to `EVENT_START` in `components/qe/count-up.tsx` (3 PM IST, from the official logo). Each unit replays the number pop-in recipe when it changes.


The loading intro assembles the logo’s three arms, then wipes away once the page has loaded. It runs once per browser-tab session (`sessionStorage`), shortens to a fade under reduced motion, and hides itself after 5s even if JavaScript fails. Logo colours (`--qe-cyan`, `--qe-yellow`, `--qe-red`) appear only in the loader, scroll-progress bar, section-label marks and the hero full stop.


The game uses a UTC date seed, giving visitors the same daily puzzle sequence. Share links retain the seed and mode. Results are personal scores, not a verified global leaderboard. No login or tracking is required to play.

The home hero uses the "columns" background from `components/qe/hero-bg/qe-backgrounds.js`: quantized vertical light bars (28 on desktop, 12 on phones) lit by a drifting source that follows the pointer; clicking sends light up a bar. It pauses when off-screen or the tab is hidden, shows a still frame under reduced motion, and follows the footer motion switch. GSAP handles reveal, parallax and text-scroll effects.

## Deployment

This is a Next.js (App Router) application deployed on Vercel; see **Deploy to Vercel** above. It is not a static HTML export: `/api/submissions` runs as a serverless function and needs `DATABASE_URL`. The animated favicon spins natively in Firefox (CSS inside `public/favicon.svg`) and is redrawn on a canvas in Chromium browsers (`components/qe/favicon.tsx`); Safari shows the static icon.

## Sources and assets

- Event content and historic photos: https://qeconclave.com/
- Original repository: https://github.com/Amaankvofdd06021999/QE-Conclave-2026
- Tunnel footage: supplied by the project owner; optimized for web playback.
- QE Conclave logos, 2026 intro film (`qe-intro.mp4`) and edition photography: https://qeconclave.com/
- Inter: Rasmus Andersson, SIL Open Font License.
- Three.js, GSAP, Lucide, Radix and dependencies retain their respective licences; refer to each dependency package.

Original brand marks, photos, speaker images and video remain owned by their respective rights holders.
