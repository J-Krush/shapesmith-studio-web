# External Integrations

**Analysis Date:** 2026-05-02

## APIs & External Services

**Content Management (Sanity CMS):**
- Sanity.io — Headless CMS used as the single source of truth for all dynamic site content (laser-cutting styles, materials, profile/about-me copy, process steps, collaborations, laser-bed reference imagery).
  - SDK/Client: `@sanity/client` `^6.1.7` (resolved `6.29.1`)
  - Initialized in: `src/utilities/sanityClient.jsx`
  - Project ID: `qx9kep1e` (hard-coded — public read-only data, no token)
  - Dataset: `production`
  - API version: `2023-06-16`
  - CDN: `useCdn: true` (cached, eventually-consistent reads)
  - Auth: None — anonymous public read access; no API token, no env var
  - Query language: GROQ (Sanity's native query language) called via `sanityClient.fetch(...)`

  **Document types queried (GROQ schema in use):**
  | `_type` | Purpose | Queried in |
  |---------|---------|------------|
  | `profile` | About-me bio + portrait images | `src/context/AboutMeContext.jsx:12` |
  | `laser-style` | Portfolio "styles" / capabilities (slug, description, materials, gallery) | `src/context/ProjectsContext.jsx:13` |
  | `material` | Laser-cutting material catalog (specs, processes, disclaimer, image) | `src/pages/Materials.jsx:11` |
  | `maker-process` | "Our process" home-page steps (ordered, image, description) | `src/components/home/OurProcess.jsx:10` |
  | `collaboration` | "We love collaborations" home-page block | `src/components/home/Collaborations.jsx:11` |
  | `laser-specs` | Bed-size + oversized-piece reference images for "Size Matters" block | `src/components/home/QuickSpecs.jsx:11` |

  All queries follow the same shape: dereference `asset->` to expand image references and extract `_id` + `url`. Image URLs come back as Sanity CDN links (e.g. `https://cdn.sanity.io/images/qx9kep1e/production/...`).

**Form Submission (Netlify Forms):**
- Netlify Forms — Zero-config form handler that captures `application/x-www-form-urlencoded` POSTs against the deployed Netlify site.
  - SDK/Client: None (plain `fetch`)
  - Auth: None (Netlify identifies the form by `name="contact-form"` and the prerendered shell)
  - Honeypot: `bot-field` (declared in `public/index.html:37` and submitted on every POST)
  - Active production submitter: `src/components/contact/ContactForm.jsx:29` — POSTs to `https://shapesmith.studio/`
  - Legacy / demo submitters (still in repo): `src/components/contact/contact-form.js:21` (POSTs to `/`) and `src/components/HireMeModal.jsx:21` (POSTs to `/`). These appear unused by current routes.
  - Prerender shim: `public/index.html:34-45` contains a hidden duplicate of the form with `netlify` + `netlify-honeypot` attributes so Netlify's build-time HTML scanner can register it.

## Data Storage

**Databases:**
- None directly. All persistent content lives in Sanity (managed off-platform) and is fetched at runtime from the Sanity CDN.

**File Storage:**
- Sanity Asset CDN — All images served from `https://cdn.sanity.io/...` (delivered through `asset->{_id, url}` expansion in GROQ).
- Static `public/` assets — `favicon.png`, `manifest.json`, `robots.txt` only.
- Bundled local assets — `src/assets/`, `src/fonts/`, and the (git-ignored) `src/images/` directory contain hero images, the logo (`logo-flower-of-life-dark.png`), and webfonts that are bundled at build time. Note `/src/images` is in `.gitignore:15` — large local imagery is intentionally not committed.
- Google Drive (legacy / dead) — `src/utilities/helpers.jsx:19-22` exports `getGoogleDriveLink(id)` that returns `https://drive.google.com/uc?id={id}`. Tied to the unused `getImageUrl()` / `isProd()` path; superseded by Sanity URLs and not referenced from any current rendering path.

**Caching:**
- Sanity CDN edge caching only (`useCdn: true`). No client-side cache layer (no React Query, no SWR, no localStorage caching of Sanity data).

## Authentication & Identity

**Auth Provider:**
- None — This is a public marketing site. There are no logged-in users, no session, no auth provider, no protected routes.
- The only `localStorage` write is the dark-mode flag in `src/App.js:27` (`localStorage.setItem('theme', 'dark')`), which is forced unconditionally on every render.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Datadog, Rollbar, or similar SDK present. Sanity fetch errors fall through to `console.error` (e.g. `src/context/ProjectsContext.jsx:41`).

**Analytics:**
- None detected — no GA, Plausible, Fathom, Segment, or PostHog scripts in `public/index.html` or anywhere in `src/`.

**Performance Metrics:**
- `web-vitals` `^2.1.4` is installed and wired up in `src/reportWebVitals.js`, but `src/index.js:17` calls `reportWebVitals()` with no callback, so metrics are computed and discarded. There is no analytics endpoint receiving them.

**Logs:**
- Browser `console.*` only. Several `console.log` debug statements were recently commented out (see commit `fe89746 refactor: comment out console logs`).

## CI/CD & Deployment

**Hosting:**
- Netlify (inferred) — Strongly suggested by:
  - The Netlify-specific hidden form in `public/index.html:34-45`
  - `data-netlify="true"` and `netlify-honeypot="bot-field"` attributes in `src/components/contact/contact-form.js:41-43`
  - Production form action pointing to the bare domain `https://shapesmith.studio/` (Netlify Forms posts to the form's host page)
- No `netlify.toml`, `vercel.json`, `firebase.json`, or `_redirects` file is committed. Build settings are presumed to be configured via the Netlify dashboard (likely `pnpm build` / publish dir `build`).

**CI Pipeline:**
- None in repo — no `.github/workflows/`, no `.gitlab-ci.yml`, no `.circleci/`, no `azure-pipelines.yml`. Builds are triggered by Netlify on `git push` to GitHub (`github.com/J-Krush/...`).

## Environment Configuration

**Required env vars:**
- None for runtime. The app builds and runs with no environment variables set.
- Optional / vestigial: `REACT_APP_ENV` is read by `src/utilities/helpers.jsx:3` but the helper returns `true` in both branches, so the variable has no effect.

**Secrets location:**
- No secrets in repo. `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local` are all git-ignored (`.gitignore:19-22, 28`).
- Sanity is accessed without a token (CDN public read), so no secret is required client-side. If write access or authenticated reads are ever needed, a `SANITY_TOKEN` env var should be introduced and the client moved behind a serverless function (the token must never ship in the browser bundle).

## Webhooks & Callbacks

**Incoming:**
- None. The site is a static SPA with no API surface.

**Outgoing:**
- Contact form POST — `https://shapesmith.studio/` (`src/components/contact/ContactForm.jsx:29`). Captured by Netlify Forms and emailed to the configured form-notification recipient (configured in Netlify dashboard).
- Sanity reads — `GET https://qx9kep1e.apicdn.sanity.io/v2023-06-16/data/query/production?query=...` issued by every page that mounts a Sanity-backed context/component.

## External Links / Social Endpoints

These are simple `<a href>` links (not API integrations) but represent the site's outbound surface area. Defined in `src/components/reusable/SocialLinks.jsx:8-29` and `src/components/contact/ContactDetails.jsx:3-16`:
- Instagram: `https://www.instagram.com/shapesmith.studio/`
- Personal site: `https://www.johnkreisher.com/`
- GitHub: `https://github.com/J-Krush`
- LinkedIn: `https://www.linkedin.com/in/john-kreisher-792aa34b/`
- Email (mailto): `jkrush@shapesmith.studio`

---

*Integration audit: 2026-05-02*
