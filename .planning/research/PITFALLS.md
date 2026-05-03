# Pitfalls Research

**Domain:** One-person maker-studio marketing site (laser cutting + 3D printing) on Create React App + Sanity + Netlify, evolving toward instant-quote and shop features
**Researched:** 2026-05-02
**Confidence:** MEDIUM-HIGH (specific items verified against existing codebase + recent industry sources; some prevention strategies are judgement calls)

The headline question this document answers: when this kind of project (small custom-fab studio site, paused for years, returning JS-only on a deprecated build tool, planning to add a parallel service surface, then file-uploaded auto-pricing, then a shop) goes badly — *how* does it go badly, and what do we put in the roadmap to stop that?

Phase mapping below uses the user's three-bundle plan from `PROJECT.md`:
- **Bundle 1 — Spruce + 3D printing launch**
- **Bundle 2 — Auto-pricing quote feature**
- **Bundle 3 — Shop**
- **Ongoing** — discipline that doesn't belong to any single bundle

---

## Critical Pitfalls

### Pitfall 1: Auto-quote price wildly diverges from reality, customer expects the quoted number

**What goes wrong:**
A visitor uploads an STL, the page shows "Estimated: $42." Slicer-based volume math is off (support material, infill changes, wall count, raft, plate orientation, rate of failed prints), or laser SVG estimate misses kerf/feed-rate variance, and the actual job costs $80. Customer either feels bait-and-switched, or the studio eats the loss to preserve goodwill. Either way, conversion died and trust died with it. This is the single biggest legal/expectations risk in Bundle 2.

**Why it happens:**
Volume × density × material rate is genuinely close-but-not-exact. Support generation, raft, infill gradient, and brim are slicer-dependent. A real slicer pass (which platforms like Quot3D use under the hood) is far more accurate than a geometric estimate, but is heavy to run. The temptation is to ship a bare estimator and call it a "quote."

**How to avoid:**
- Never use the word "quote" in UI copy until the studio has manually confirmed. The instant number is an **"estimate,"** "ballpark," or **"starting at"** price. Final price requires owner sign-off.
- Show a visible range (`$35–$55`) not a single point estimate. A range communicates uncertainty truthfully and gives room to absorb variance.
- Display a one-line disclaimer next to the number: *"Final quote may vary based on print orientation, supports, and finishing."* Industry tools like i.FacFox use almost this exact phrasing.
- Build in a markup buffer (15–25%) on top of the math so most jobs round down at confirmation rather than up. Customers love when their actual price is lower than the estimate.
- Send every estimate to the studio owner for review **before** anything binds. The "Submit quote" CTA should land in email, not in a contract.
- Cap the highest-variance categories early: very small parts (high failure rate per dollar), very thin walls (might fail to slice), enormous parts (require splitting). Reject these in-UI rather than pretending to estimate them.

**Warning signs:**
- Owner manually adjusts more than ~30% of submitted estimates after review (math is off, not just edge cases).
- A customer ever messages "but the website said $X."
- Code uses single-number outputs anywhere (range model not adopted).

**Phase to address:** Bundle 2 (auto-pricing). Disclaimer copy + range display + manual confirmation gate are non-negotiable acceptance criteria for that phase.

---

### Pitfall 2: CRA dependency rot eventually breaks the build during a non-build week

**What goes wrong:**
The site sits for months. A new Node LTS lands. `--openssl-legacy-provider` flag is removed or repositioned in `NODE_OPTIONS`. A transitive `webpack-dev-server` / `postcss` / `nth-check` CVE causes `npm audit` to fail CI. Owner returns to ship a small content tweak and spends a weekend fighting `react-scripts` instead. Worst case: a Netlify build image bump silently breaks the production build, customers see a stale site for days. CRA was [officially deprecated by the React team in February 2025](https://react.dev/blog/2025/02/14/sunsetting-create-react-app), and accumulates CVEs with no remediation path.

**Why it happens:**
CRA 5.0.1 is the final release. Its dependency tree (Webpack 4-era crypto, Babel polyfills, deprecated postcss plugins) is frozen. Newer Node versions, newer transitive deps, and newer React versions create incompatibilities that no upstream is going to fix. The OpenSSL flag is itself a workaround layered on a workaround.

**How to avoid (without burning a migration budget right now):**
- **Pin the build environment.** Add `.nvmrc` (Node 20 LTS) and Netlify `NODE_VERSION` env to lock the toolchain. The current `--openssl-legacy-provider` flag works on Node 18 and 20; that's the safe band. Document the pin in README.
- **Pin Netlify build image** in `netlify.toml` (currently absent). Don't let Netlify silently upgrade Ubuntu/Node under you.
- **Commit `pnpm-lock.yaml`** (currently untracked per `git status`). Without it, every CI run installs slightly different deps.
- **Add a thin smoke job** — a single GitHub Action or Netlify build hook that runs `pnpm build` weekly on the pinned Node version. Catches rot before it bites in a release window.
- **Plan a Vite migration as a future bundle, not now.** Vite preserves React + JSX with minimal source changes (mostly env-var prefix, entry HTML) and is the lowest-friction CRA exit. Schedule it after Bundle 1 ships, before Bundle 3 (shop) — avoid doing migration + new revenue feature in the same window.
- **Do not run `npm audit fix --force` on this codebase.** It will rewrite resolutions that CRA 5 expects and break the build. Ignore audit noise from frozen transitive deps unless an actively exploited CVE in a runtime path appears.

**Warning signs:**
- Build script needs a new flag every time Node updates.
- `npm install` warns about peer-dep mismatches that didn't exist last month.
- A community package you depend on drops support for Webpack 4 / CRA.
- Netlify build logs start showing deprecation warnings for `react-scripts`.

**Phase to address:** Bundle 1 (lock environment + commit lockfile + add smoke job). Vite migration is its own deferred bundle — flag in roadmap as "before Bundle 3."

---

### Pitfall 3: `/3d-printing` and `/styles` drift apart, then get force-merged into a wrong abstraction

**What goes wrong:**
You mirror `/styles` into `/3d-printing` (correct call per `PROJECT.md`). Six months later the two service pages have subtly different headers, different "request a quote" CTA placement, different filter behavior. When you finally try to extract a shared `ServicePage` component, you end up with a mess of `if (service === '3d-printing') { ... }` branches — Sandi Metz's "wrong abstraction." Both pages get worse, neither gets better.

**Why it happens:**
The Rule of Three: don't abstract until you have three duplicates. With two services you have *two* duplicates, which is exactly the dangerous middle: enough that copying feels wrong, not enough to see the right shape. Pressure to DRY pushes you toward an abstraction that handles two cases (current) but not three (future), and adding the third forces a refactor of all three.

**How to avoid:**
- **Duplicate freely in Bundle 1.** Copy `Projects.jsx` → `ThreeDPrinting.jsx`, copy `ProjectsContext.jsx` → `ThreeDPrintingContext.jsx`, copy `ProjectsGrid.jsx` → `ThreeDPrintingGrid.jsx`. Resist any urge to parameterize.
- **Pull out only what is genuinely identical** between the two: the GROQ-fetch boilerplate (`useSanityQuery({ query, params }) => {data, loading, error}`), the card layout if pixel-identical, the modal/lightbox refactor (replacing the imperative DOM modal). These have a clear single shape.
- **Sanity schema: separate documents, shared field groups.** Don't try to make one `service-style` schema with a `serviceType: 'laser' | '3d'` discriminator. The two services already differ in `preferredMaterials` semantics (laser plywood vs 3D printer filaments), and they will diverge more (3D printing wants infill/orientation hints; laser wants kerf/passes). Keep `laser-style` and add a parallel `print-style` doc type. Share field references for things that *are* identical (e.g., a reusable `material` reference field).
- **Defer abstraction until there is a third service or a third use of a pattern.** When the shop comes (Bundle 3), you'll have three list-of-things pages — that's the moment to consider `useSanityQuery` → `<ServiceGrid>` extraction.
- **Keep URLs first-class.** `/3d-printing` is a top-level concept, not `/services/3d-printing`. Painting yourself into a `/services/...` corner makes future SEO/marketing changes painful.

**Warning signs:**
- Any function or component takes a `serviceType` parameter and switches on it. (Switching in shared code = wrong abstraction.)
- A bug fix in laser styles needs a copy-paste fix in 3D printing styles. (This is the *good* version — duplication caught the drift.)
- A bug fix in the shared component requires conditional logic to not break one of the two services.
- The two pages' visual designs have diverged in ways that aren't intentional.

**Phase to address:** Bundle 1 (duplicate without abstracting). Revisit in Bundle 3 when a third pattern emerges. Document the explicit decision in `Key Decisions` of `PROJECT.md` so future-you doesn't re-fight it.

---

### Pitfall 4: Half-spruce — refresh stops at hero/nav, rest of site stays old

**What goes wrong:**
You refresh the homepage hero and nav (the most visible surfaces). Everything else — `/contact`, `/about`, project detail pages, footer — keeps the old palette, old type rhythm, old button sizing. Visitors who land on `/styles/some-project` from a direct link see the unspruced version and bounce. Or worse: every page individually looks fine but side-by-side they reveal the seam, undermining the "looks legit" core value.

**Why it happens:**
Targeted-refresh scope tries to ship visible-impact changes fast, but visual identity is connected: changing nav typography without changing footer typography looks unintentional. Without design tokens, "the new spacing/color" lives in JSX classes scattered across files. Changes drift component-by-component as developer attention flags.

**How to avoid:**
- **Define the spruce as a token diff first, not a component-by-component pass.** Update `tailwind.config.js` palette, type scale, and spacing once. Then component changes flow from the tokens.
- **Make the spruce a token-first PR.** Even with Tailwind v3, lift any "new spruce blue" / "new spruce gray" into the config palette so every component picks it up via class. Avoid arbitrary hex values in JSX (`#348bd8`, `bg-[#3a2840]` etc.).
- **Walk every route with a checklist before shipping Bundle 1.** Home → /styles → /styles/:slug → /3d-printing → /3d-printing/:slug → /materials (transitional) → /about → /contact → /shop. Print this checklist into the bundle's acceptance criteria.
- **Strip dead `dark:` Tailwind variants** (per `CONCERNS.md` they're already wasted because the theme is force-dark). This is the cheapest way to detect inconsistency — if a class doesn't render in dark mode now, you'll see it in the audit.
- **Decide commit-or-strip on the theme switcher.** `useThemeSwitcher` is dead code; either revive it (then real risk: light mode will look bad without a corresponding light-mode design pass) or remove it entirely. Don't leave it half.
- **Commit "design system" tokens to Sanity-driven pages too** — make sure project cards, material cards, etc. all use the same shared spacing/type primitives.

**Warning signs:**
- Two pages use different shades of the same notional color (e.g., `bg-primary-dark` vs hardcoded `#291c30` somewhere else).
- A hardcoded hex value appears in any `.jsx` file (search `#[0-9a-f]{3,8}`).
- A page hasn't been touched during the spruce pass — that's a tell that it's about to look old.
- New components introduce new tokens (`border-gray-700`) instead of reusing palette tokens.

**Phase to address:** Bundle 1. The "looks legit" core value is *the entire bundle's reason for existing* — incomplete spruce = bundle failure.

---

### Pitfall 5: Honeypot half-fix + no real spam protection = inbox flood

**What goes wrong:**
Currently the contact form's honeypot field is rendered visibly (per `CONCERNS.md`) — bots fill it, Netlify rejects, but most site refresh discussions also bump traffic visibility, which raises the bar on bot attention. After Bundle 1, the contact form (still the only inbound channel) starts getting real spam through. Bundle 2's quote form is even juicier — file uploads, more fields, more value to scrape.

**Why it happens:**
Honeypots only stop low-effort bots. The current implementation (visible field with placeholder *"Don't fill this out if you're human"*) is approximately useless. Once spam volume grows, manual triage burns owner time, real leads get lost in the noise, and the studio stops checking the inbox.

**How to avoid:**
- **Fix the honeypot** as part of Bundle 1 spruce: wrap the `bot-field` in `display: none` or `aria-hidden + visually-hidden` styling. Mirror the hidden-form approach Netlify documents.
- **Make the form action relative** (`fetch("/")` or `fetch("/contact")`) so dev environment doesn't post to prod. The orphaned `contact-form.js` already has this pattern.
- **Add Netlify's bot detection** (free, in dashboard) plus a reCAPTCHA v3 (invisible, friction-free) before Bundle 2. Netlify Forms has a one-click toggle for both.
- **Swap `alert(error)` for inline form errors** so submission failures don't look like a bug to users. Currently a spam-failed submission would `alert()` the raw error.
- **Email forwarding rules.** Set up a single `quotes@` and `contact@` alias with mailbox folders/labels — gives owner future sortability without code changes.

**Warning signs:**
- Owner reports any inbox spam beyond ~1/week.
- Any honeypot value other than empty in submissions.
- Form submissions with mismatched `service-interested-in` and message body content.

**Phase to address:** Bundle 1 (honeypot fix + relative URL). Bundle 2 (reCAPTCHA before adding the higher-value file-upload form).

---

### Pitfall 6: File upload step is where conversion dies

**What goes wrong:**
Bundle 2 launches. Visitors hit the quote tool, drag a file, and... nothing happens for 4 seconds while the SPA hashes/validates/parses the STL. They drop a 200MB binary blob, the page silently fails. They don't know what file types are accepted until they've already tried. They abandon. The quote feature has zero conversion.

**Why it happens:**
File uploads are slow, opaque, and frustrating. STL files can be 50–500MB for detailed models. SVG files can have hundreds of thousands of paths. Without progress feedback, users assume something is broken. Without size/format validation up-front, users waste minutes on an upload that's going to be rejected.

**How to avoid:**
- **Stated constraints up-front, before the user touches a file.** Visible labels: `STL or 3MF, up to 100MB` (3D), `SVG or DXF, up to 10MB` (laser). Don't make the user discover this by failing.
- **Client-side validation first.** Reject obvious bad files immediately (wrong extension, too large) before any network round-trip. Show a friendly error inline.
- **Progress indicator with percent + estimate.** Even for client-side hash/parse work, show a visible progress bar so the user knows something is happening.
- **Drop zone with hover state** — dashed border that lights up on drag. Don't make users find a "Choose file" button hidden in a corner.
- **Allow file replacement without page reload.** If they upload the wrong file, "Change file" should be one click.
- **Show the file thumbnail/info immediately** ("box.stl, 4.2 MB, ~12 cm³") — confirms the upload worked and gives the user something to verify before committing.
- **Save progress in `localStorage`** so a page refresh doesn't lose their material/option selections.
- **Persistent loading state, not a single spinner.** Multi-step quote = multi-step progress visible to the user ("Uploading → Analyzing → Calculating → Done").
- **Mobile-friendly upload affordance.** Native `<input type="file">` plus drag-and-drop on desktop. Don't depend on drag/drop alone.

**Warning signs:**
- Owner sees quote-form analytics: high bounce on the upload step specifically.
- Network logs show truncated POST requests (size limit hit silently).
- Any upload path without progress UI.
- Single error state for "anything went wrong."

**Phase to address:** Bundle 2. Build the upload UX *first* in that bundle — it gates everything else.

---

### Pitfall 7: STL/SVG file uploads = unvalidated user input on a static SPA

**What goes wrong:**
A visitor uploads a "file" that's actually an executable, an enormous zip bomb, an SVG with embedded scripts (`<script>`, `onload`), or a malformed STL designed to crash the parser. With no backend, validation is whatever the SPA does in the browser; uploads that pass validation end up either (a) sent to the studio owner who opens them locally, or (b) handed to a third-party slicer/storage service. The malicious vectors are real per [academic security analyses of additive manufacturing files](https://dl.acm.org/doi/fullHtml/10.1145/3471621.3471843).

**Why it happens:**
"It's just an STL file" feels safe. STL is a simple binary format, SVG is XML — until you remember SVG is XML *and a script execution context*. STL files can be steganographically loaded with arbitrary payloads. The owner's local machine becomes the attack surface every time they download a quote attachment.

**How to avoid:**
- **Hard size cap, hard format whitelist, both client-side and at upload service.** STL/3MF for 3D, SVG/DXF for laser. Reject everything else by extension AND magic bytes.
- **Don't send raw uploaded files to the studio's email.** Store them in a service that scans (e.g., Sanity asset pipeline if you go that route, or a dedicated upload service like Uploadcare/Cloudinary that strips dangerous content). Send the studio owner a *link* to the sanitized asset.
- **SVG sanitization is mandatory** — strip `<script>`, `<foreignObject>`, event handlers (`onload`, `onclick`, etc.). Use a library like `DOMPurify` configured for SVG before previewing.
- **Never render uploaded SVG inline in the page** as an `<svg>` element from user content — that's an XSS vector. Render as `<img src="...">` from a sanitized URL only.
- **Clamp STL parsing memory.** If using a client-side parser (e.g., `three.js` STLLoader), bound max triangle count and bail out gracefully on oversized geometry instead of locking the browser.
- **Don't auto-download anything to the owner's machine.** All files should be reviewable in-browser via a sandboxed preview before any local download.
- **Add antivirus scanning** if/when an upload service is in the loop (most modern asset CDNs include this; flag it explicitly when picking a vendor).
- **Show an explicit user notice:** "Uploaded files are scanned and reviewed by a human before processing." Sets expectations and discourages casual abuse.

**Warning signs:**
- Owner ever opens uploaded files locally (e.g., double-clicks email attachments). This is a procedural failure, not a code one.
- Code path that sends raw multipart bodies to email or unscanned storage.
- SVG rendered inline anywhere via `dangerouslySetInnerHTML`.

**Phase to address:** Bundle 2. Decide the upload + storage vendor as the *first* discovery task in that bundle — every other choice flows from it.

---

### Pitfall 8: Sanity schema sprawl — every new feature adds a doc type, GROQ queries duplicate, fetch waterfalls multiply

**What goes wrong:**
Currently you have 6 schemas (`profile`, `laser-style`, `maker-process`, `laser-specs`, `material`, `collaboration`). Bundle 1 adds `print-style` (or similar) → 7. Bundle 2 adds `quote-config` (rates, machine times, materials with cost data) → 8 or 9. Bundle 3 adds `product`, `category`, `inventory`, `order` → 12+. Per `CONCERNS.md`, the home page already runs 5 sequential Sanity queries on first paint. By Bundle 3, that's 8–10. Time-to-interactive degrades. Loading states multiply. Each schema invents its own GROQ patterns.

**Why it happens:**
Easy to add a Sanity schema. Easy to add a `useEffect` fetch. The cost is invisible per-feature but compounds: response payload bloat from over-fetching ([per Sanity docs, projections matter](https://www.sanity.io/docs/high-performance-groq)), waterfall on the network panel, duplicated query strings inline in components.

**How to avoid:**
- **One `useSanityQuery(query, params)` hook** for all fetches — currently per `ARCHITECTURE.md` there are two parallel idioms (Context + inline `useEffect`). Pick the hook pattern. Builds a single point for cache, loading state, error state, retry.
- **Sort + filter in GROQ, not in JSX.** Per `CONCERNS.md`, several components currently `.sort()` in render — costly + buggy (mutates source). Move to GROQ `| order(...)`.
- **Composite page-level GROQ queries.** Home page should fetch the data for *all* its sections in one query, not 5. GROQ supports projections that pull related doc types in a single round-trip:
  ```
  {
    "process": *[_type == "maker-process"] | order(order asc),
    "specs": *[_type == "laser-specs"][0],
    "collaborations": *[_type == "collaboration"],
    "projects": *[_type == "laser-style"]{...}
  }
  ```
- **Always use projections** (`{title, slug, ...}`) — never bare `*[...]` that pulls full documents.
- **Use Sanity's image URL builder** (`@sanity/image-url`) for thumbnail variants instead of full-res URLs. Currently `asset->url` returns the original full asset.
- **Promote heavy/shared documents to root-level Context once** (`ProjectsProvider` is currently re-mounted per page → re-fetches on every navigation, per `CONCERNS.md`).
- **Schema discipline: shared field-level types.** Material reference field, image field, slug field should be defined once and reused. Not 7 separate ad-hoc shapes.
- **Document the schema list and dependencies** in `STACK.md` or a Sanity-specific doc. When adding a doc type, force a moment of "do we already have one of these?"

**Warning signs:**
- Network panel shows >3 Sanity requests for any single page.
- Two GROQ queries that look almost identical except for a `_type ==`.
- Same component re-fetches on remount when the data is application-wide.
- Image payloads exceed 500KB on a non-detail page.

**Phase to address:** Bundle 1 (introduce `useSanityQuery`, hoist `ProjectsProvider` + new `PrintsProvider` to app root, switch to GROQ-side ordering, switch to image URL builder for thumbnails). Ongoing discipline beyond that.

---

### Pitfall 9: Local SEO + photography are the actual conversion levers, and they get deferred

**What goes wrong:**
For a *local* maker studio, two things matter more than feature richness: (1) "laser cutting [city]" / "3D printing [city]" search visibility, (2) photos that look like a real studio's work, not a portfolio template. The site currently has the CRA default meta description (per `CONCERNS.md`), no per-page titles, no `og:` tags, no JSON-LD, no sitemap, no schema.org `LocalBusiness` markup. And per `PROJECT.md`, no 3D-print photos exist yet — placeholder blocks are the planned fallback.

**Why it happens:**
SEO + photo work feel orthogonal to "shipping features," so they get bumped. But for a marketing-driven local business site, they *are* the feature.

**How to avoid:**
- **Per-page `<title>` and `<meta description>`** at minimum. `react-helmet-async` is the cheapest install for CRA.
- **Schema.org `LocalBusiness` JSON-LD** on the homepage with address (or service area), hours, services offered, social links. This is the table-stakes block that gets you into local-pack results.
- **`og:image` per page** — for `/3d-printing` use a hero photo of an actual print, not a generic illustration. Sanity's image URL builder makes this trivial.
- **`sitemap.xml` + `robots.txt`** generated at build time. CRA doesn't do this for free; add a small build script.
- **Real photos before launch, even if just iPhone shots in good window light.** Per `PROJECT.md` photos are coming from the new Bambu H2D — schedule a photo session as part of Bundle 1's launch checklist, not "after."
- **Image alt text from Sanity.** Per `CONCERNS.md`, alt text fields exist in the Sanity schema but are not bound (`alt=""` in `AboutMeBio.jsx`). Wire them up; this is also a11y, not just SEO.
- **Page-level loading states + skeletons** — Google Lighthouse penalizes invisible-content-during-load (CLS). Currently the site renders empty grids until Sanity returns.
- **Self-hosted fonts are already optimized for performance** but per `CONCERNS.md` there are 38+ unused font files in the build. Audit and remove. WOFF2 + WOFF only.

**Warning signs:**
- Google Search Console "Coverage" reports duplicate `<title>` across pages.
- Lighthouse SEO score < 90.
- Owner Googles "[city] laser cutting" and the studio doesn't appear.
- An external page (Instagram, LinkedIn) links to the site and the OG preview is the CRA default.

**Phase to address:** Bundle 1. Specifically as part of the spruce — the spruce is incomplete without these. Photography is owner work that runs in parallel; flag it as a non-code dependency in the bundle plan.

---

### Pitfall 10: Shop platform decision deferred too long, then bundled too tightly

**What goes wrong:**
Per `PROJECT.md` the shop platform decision is correctly deferred to Bundle 3's discovery. That's right. But two failure modes wait at the other end:
1. **Decision delays Bundle 3 indefinitely** — every option (Shopify Buy SDK, Stripe Checkout, Snipcart) has tradeoffs nobody's hot to spend a week comparing.
2. **Decision happens, then platform-specific concerns (tax, shipping, inventory, refunds) turn into half the bundle scope.** Stripe Checkout in particular has [non-trivial tax + shipping + customer-update gotchas](https://docs.stripe.com/tax/checkout). Snipcart is simpler but charges per-transaction. Shopify Buy SDK forces checkout off-domain.

**Why it happens:**
A "shop" is shorthand for ten subsystems: catalog, cart, checkout, payment, fulfillment, tax, shipping, inventory, refunds, customer email. Picking a platform delegates some of these but never all of them. Picking wrong (or picking before pre-made-goods inventory size is known) costs a migration later.

**How to avoid:**
- **Discovery first phase of Bundle 3 — write a one-page comparison** with 3–5 axes that match this studio's real constraints: small SKU count (< 50 likely), one-person fulfillment, US-state tax handling, no subscriptions, no configurable products (per `PROJECT.md` Out of Scope), need to keep visual identity.
- **Default recommendation if no surprises emerge:** Stripe Checkout + Sanity-managed catalog (products as a Sanity doc type, stripe price IDs as a field). This keeps the catalog in the same CMS as everything else, costs ~2.9% per transaction (no monthly fee), and lets the existing static SPA stay static. The downside is shipping/tax config cost — but Stripe Tax + a fixed flat-rate shipping is fine for a local studio with minimal SKUs. Avoid Shopify until/unless the inventory model justifies it; avoid Snipcart's monthly fee for low-volume.
- **Don't bundle tax registration with shop launch.** Soft-launch with a single tax jurisdiction (the studio's state) and document the limit clearly. Defer multi-state until volume justifies it.
- **Plan for cart state to NOT persist across sessions** initially. localStorage cart is fine; full account-bound carts require auth, which is explicitly out of scope per `PROJECT.md`.
- **SEO for product pages: pre-render the product list and detail pages.** This is the strongest argument for revisiting the CRA-vs-Vite-vs-Next.js question *before* Bundle 3. Client-rendered product pages don't index well; they don't show in Google Shopping; they generate weak OG previews. Either accept this (small studio, mostly Instagram-driven traffic — defensible) or schedule a Vite + something-like-`vite-react-ssg` migration as Bundle 3's prerequisite.
- **Pick a platform that lets you leave.** Stripe Checkout transactions are portable; Sanity catalog data is exportable. Avoid lock-in to a Buy Button HTML embed that owns your data.

**Warning signs:**
- Bundle 3 discovery slips more than two weeks past Bundle 2 completion.
- Discovery doc grows beyond one page.
- Decision gets escalated to a "broader rebuild" conversation.
- Tax/shipping subscope balloons before payment integration is even working.

**Phase to address:** Bundle 3 (discovery as first sub-phase, hard-bounded to 1 week). Also informs the Vite migration timing — see Pitfall 2.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip migrating CRA → Vite "for now" | Bundle 1 ships faster, scope stays focused | Build will eventually break on Node update; transitive CVEs accumulate; SEO-relevant SSG remains out of reach | Until Bundle 1 ships. Then schedule before Bundle 3. |
| Duplicate `/styles` code into `/3d-printing` instead of abstracting | Avoids wrong-abstraction trap; ships fast | More files to maintain; bug fixes need to land in two places | Always for two-way duplication. Re-evaluate at three. |
| Hardcoded Sanity `projectId` in source | Works today, no env-var plumbing | Can't run a staging dataset; can't experiment with schema migrations safely | Never beyond Bundle 1. Move to env vars during the spruce. |
| One Sanity dataset (`production`) for dev + prod | No infrastructure work | Editing schemas live = breaking production; testing content changes is on real users | Bundle 1. Add `staging` dataset before Bundle 2's content-config work. |
| No real tests beyond the broken `App.test.js` | Faster feature velocity | Every change is a manual QA pass; regressions land silently | Bundle 1 only if a smoke test covering app-mount + each route lands. Bundle 2 file-upload validation needs unit tests. Bundle 3 cart/checkout needs integration tests. |
| Use the existing contact form for quote intake before Bundle 2 | Bundle 1 doesn't block on form work | Quote inquiries arrive without file attachments and without service context; owner does manual back-and-forth to gather info | Until Bundle 2 ships (max ~1–3 months). Beyond that, conversion suffers. |
| Skip image optimization (Sanity image URL builder, srcset, lazy-load) | Bundle 1 doesn't need a refactor | LCP regression as gallery grows; mobile experience suffers; Lighthouse SEO score drops | Never if there are >20 images on a page. With current ~6 styles, low priority for Bundle 1; mandatory before Bundle 3. |
| Force-dark theme via render side-effect | Visual consistency works today | Violates React purity; `useThemeSwitcher` rots; future light-mode design pass requires a real cleanup | Until Bundle 1 ships fixed. Either (a) remove the side effect AND `useThemeSwitcher` AND `dark:` variants (commit to dark-only), or (b) move side effect into `useEffect` and re-enable switcher. Don't leave half. |
| Skip per-environment Netlify build pinning | Works today | One day a Netlify image bump breaks build silently | Never beyond Bundle 1 spruce. |
| Defer reCAPTCHA / spam protection | Bundle 1 spam is bearable | Once Bundle 2 quote form ships, file-upload spam becomes painful fast | Pre-Bundle-2 only. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sanity (current) | Per-component `useEffect` fetches with no shared loading/error pattern | Single `useSanityQuery` hook; root-level providers for shared data; composite page-level GROQ |
| Sanity images | Pulling `asset->url` (full-res original) for thumbnails | Use `@sanity/image-url` builder with `width`, `quality`, `auto('format')` for variants |
| Netlify Forms | Hardcoded prod-domain `fetch("https://shapesmith.studio/")` from dev environment + visible honeypot | Relative `fetch("/")` + visually-hidden honeypot + Netlify dashboard bot detection toggle + reCAPTCHA v3 before higher-value forms |
| Netlify build | No pinned Node version, no committed lockfile, no `netlify.toml` | `.nvmrc` + `pnpm-lock.yaml` committed + `netlify.toml` with `[build.environment]` `NODE_VERSION` and explicit image |
| Stripe Checkout (future) | Forgetting `customer_update[shipping] = auto` when collecting shipping addresses; missing `automatic_tax = enabled` | Use Stripe Tax with the studio's tax registration; always set customer_update; use Stripe-managed shipping rates if shipping is non-trivial |
| Stripe Tax (future) | Trying to register in every state where customers might live | Soft-launch single jurisdiction; document the boundary clearly; raise registration only when volume forces it |
| 3D file upload (future) | Sending raw multipart binaries to studio email | Upload to a dedicated asset service (Uploadcare/Cloudinary/Sanity assets) → email a link → owner reviews in-browser before any local download |
| SVG file upload (future) | Rendering uploaded SVG inline via `dangerouslySetInnerHTML` for preview | Sanitize via `DOMPurify` (SVG profile) → render as `<img>` from sanitized URL only |
| External links | `target="__blank"` typo + missing `rel="noopener noreferrer"` (per `CONCERNS.md`) | `target="_blank" rel="noopener noreferrer"` everywhere |
| Sanity schema additions | Owner adds field, code fails silently because GROQ projection doesn't include it | Document schema-spec hand-off explicitly: when schema changes, GROQ projection updates land in the same PR |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sequential per-section Sanity fetches on home page | Home TTI > 2s; flash of empty sections; network panel shows 5+ Sanity requests | Composite page-level GROQ; root-level providers | Already a soft problem; gets worse every section added |
| Re-mounting Context providers on route change | `/styles` → `/styles/foo` re-fetches projects list | Hoist `ProjectsProvider` to `App.js` once | Already happening per `CONCERNS.md`; user-noticeable on slow connections |
| Inline `.sort()` mutating Sanity arrays | Subtle ordering bugs across re-renders; React Strict Mode double-mounts amplify | Sort in GROQ (`| order(field asc)`) | Already happening per `CONCERNS.md`; bites at the next React 18 strict-mode interaction |
| Full-resolution Sanity images for thumbnails | Mobile LCP > 4s, gallery scroll janks | Sanity image URL builder + responsive `srcset` | At ~30+ images on a page or any user on mobile data |
| Bundle bloat from unused fonts | `build/` size > 5MB; first-load JS > 1MB | Audit `src/fonts/` — drop EOT, drop unused weights, WOFF2 + WOFF fallback only | Already a soft problem; mobile users feel it now |
| Bundle bloat from `styled-components` 6 RC | Larger bundle for zero usage (per `CONCERNS.md`, not actually imported) | Remove from `package.json` | Trivial today; fix during Bundle 1 cleanup |
| File-upload triggers full-page re-render | Upload progress causes selected materials/options to re-render | Co-locate upload state with form state; memoize sibling components | Bundle 2 |
| No image lazy-loading on grids | All gallery images requested at first paint | `<img loading="lazy">` + Sanity image URL builder for `width`/`height` to prevent CLS | At ~20+ images; gets worse with shop catalog |
| No request deduplication / cache | Navigate to `/styles`, back to `/`, back to `/styles` — three fetches | Introduce React Query / SWR if waterfalls grow, OR keep providers at root and rely on React state | Bundle 1 punts; Bundle 3 likely needs it |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Visible honeypot field (current) | Bots fill it correctly because they see it; Netlify rejects fewer | Wrap in `display:none` / visually-hidden; CSS-hide rather than DOM-hide so bots that parse styles still hit it |
| `target="__blank"` typo + missing `rel="noopener noreferrer"` (current per `CONCERNS.md`) | Tabnabbing — opened pages can manipulate `window.opener` | `target="_blank" rel="noopener noreferrer"` everywhere |
| `alert(error)` leaks raw error objects (current) | Stack traces / API endpoint info leak to user | Friendly fixed message; log details to error tracking |
| Hardcoded Sanity `projectId` (current) | Low risk — semi-public anyway — but ties dev/staging/prod to one dataset | Env-var-driven config |
| File uploads (Bundle 2) without server-side scanning | Studio owner downloads malicious files; XSS via uploaded SVG | Asset service with AV scanning; SVG sanitization with DOMPurify; never render uploaded content inline |
| Stripe webhook handling without signature verification (Bundle 3) | Anyone with the webhook URL can fake order events | Always verify Stripe signature on webhook endpoint (this implies a serverless function — Netlify Functions is the natural fit) |
| Cart manipulation via localStorage (Bundle 3) | User edits cart state to set price = 0; backend trusts client | Always re-price on the server / Stripe Checkout side. Never trust client-side prices. (Stripe Checkout enforces this if you use server-side Price IDs; using client-side amounts is the trap.) |
| Sanity content-write tokens leaked to client (Bundle 3 if you go that route) | Anonymous writes to your CMS | Never put a write token in client code; do mutations only via Netlify Function with the token in env |
| No rate limiting on file uploads (Bundle 2) | Single attacker can DoS your asset-service quota | Use the asset service's built-in rate limiting; or add a Netlify Function gate that throttles per IP |
| reCAPTCHA bypass via missing server-side verification | "Submit" calls reCAPTCHA on client only — bot can skip | Always verify the reCAPTCHA token server-side (Netlify Function call to Google's verify endpoint) |
| Storing customer email in localStorage / Sanity unencrypted | PII exposure if Sanity dataset is mis-permissioned | Don't persist customer info in CMS; let Stripe Customer object hold it; use Sanity for product/marketing content only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No clear pricing or "starting at" hint anywhere on service pages | Visitor can't tell if studio is in their budget; leaves to look elsewhere | Show a "starting at $X" or representative-job pricing block on each service page, even before the auto-quote ships |
| No turnaround time stated | "How fast can you ship this?" is the unanswered question that kills small jobs | Each service page states a typical turnaround range ("Most jobs ship in 5–10 days") and which conditions extend it |
| Too-technical language (`kerf`, `infill`, `nozzle`) on service pages | Local hobbyist audience bounces; PROJECT.md explicitly notes "not a designer/maker spec sheet" | Plain-language descriptions on top; technical specs collapsed/optional below |
| Claims that can't be backed up ("any material," "any size") | Leads arrive with impossible asks; owner rejects → bad experience | State the bed size, the working area, the supported material list explicitly. Limits build trust. |
| Photos that look like portfolio template stock | Site doesn't feel like a real studio; trust collapses | Real photos of real studio work, even if iPhone-quality with good light. Per `PROJECT.md`, schedule a photo session for Bundle 1 launch. |
| Requiring login or account creation for any flow before Bundle 3 | Friction that destroys quote-form conversion | Keep all read flows public (already the design); keep Bundle 2 quote form session-less |
| Mobile nav hides primary CTA | Visitor can't find "request a quote" on phone where most of them are | "Get a quote" / "Contact" CTA visible above the fold on mobile, ideally in a sticky bottom bar |
| `/shop` "Coming Soon" with no email-capture | Visitor interest dissipates; can't tell visitor when shop launches | Add an email-capture form on the Coming Soon page that piggybacks on Netlify Forms (per Bundle 1) |
| Multi-page contact / quote forms | Each page = abandonment opportunity | Single page; progressive disclosure inside it |
| Confirmation email is a generic "thanks" | Visitor wonders if anything happened; sends a follow-up email or moves on | Confirmation page + email that restates what they sent + sets a turnaround expectation ("We respond within 1 business day") |
| Materials moved to in-page sections without anchor-link affordance | Visitors who Googled "shapesmith materials" land on `/3d-printing` and don't see materials | Anchor link visible on the `/3d-printing` and `/styles` pages; preserve `/materials` as a 301 to the laser materials section (or to a combined materials index page) |
| Auto-quote tool with no "why this number" breakdown | Visitor distrusts the number; can't argue with it; leaves | Show the math: "Material $X, Machine time $Y, Setup $Z" — even rough breakdowns build trust |
| File upload silently accepts wrong format then errors at parse time | Visitor uploads, waits, fails, gives up | Validate format and size on file selection; show inline error before any work happens |

---

## "Looks Done But Isn't" Checklist

- [ ] **3D printing landing page:** Often missing real photos — verify Sanity has at least 3 print-style entries with non-placeholder `listImage`/`detailImages`, or graceful placeholder block design ships with the page.
- [ ] **Auto-pricing quote tool:** Often missing the disclaimer copy ("Estimate, final quote may vary") — verify visible text matches industry-standard language and shows a price range, not a single number.
- [ ] **Auto-pricing quote tool:** Often missing manual confirmation gate — verify there is no path from upload → paid order without an owner-in-the-loop step.
- [ ] **File upload:** Often missing client-side size + extension validation — verify rejecting a 200MB STL or a `.exe` is instant and inline.
- [ ] **File upload:** Often missing progress indicator — verify a multi-second client-side parse has visible progress.
- [ ] **Service page:** Often missing turnaround time language — verify "typical turnaround" appears on `/styles` and `/3d-printing`.
- [ ] **Service page:** Often missing "starting at" pricing or representative-job examples — verify visitors can self-qualify before contacting.
- [ ] **Honeypot fix:** Often missing the visually-hidden treatment — verify the `bot-field` input has `display: none` or visually-hidden styling and is not in the tab order.
- [ ] **Spruce:** Often skipped on internal/footer pages — verify `/about`, `/contact`, footer, project detail pages all use the new tokens.
- [ ] **Spruce:** Often misses `og:image` / per-page meta — verify each route has unique `<title>`, `<meta description>`, `og:title`, `og:image`, `og:url`.
- [ ] **Sanity migration:** Often missed environment-var-ization — verify `projectId` reads from `process.env.REACT_APP_SANITY_PROJECT_ID`.
- [ ] **CRA pinning:** Often skipped Netlify pin — verify `netlify.toml` exists with `NODE_VERSION` set and `pnpm-lock.yaml` is committed.
- [ ] **Theme cleanup:** Often half-done — verify `useThemeSwitcher` is either re-enabled with a working light mode, or fully removed (and dead `dark:` variants stripped). No middle state.
- [ ] **Tests:** Often the broken `App.test.js` is left as-is — verify it either passes or is replaced with a smoke-test of `<App />` rendering each route.
- [ ] **README:** Often still CRA boilerplate — verify it documents the actual project, current scripts, env vars needed, Sanity studio location.
- [ ] **Shop coming-soon:** Often a static "Coming Soon" with no signal — verify there's an email-capture form so warm leads are captured.
- [ ] **`/materials` route:** Often dropped without a redirect — verify a 301 (or in-page anchor link) preserves any existing inbound links.
- [ ] **Hardcoded image references:** Often left over from `src/data/*` — verify no production render path imports from `src/data/projects.js`, `src/data/materials.js`, etc., except for `capabilitiesTitle`.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Quote tool ships and prices are 30%+ off in practice | MEDIUM | Add "Estimate" framing + range immediately (1-day fix); audit slicer settings used in math; introduce a markup buffer; manual-review ALL submissions until variance < 15% |
| Customer disputes auto-quote and demands the original number | HIGH (trust) | Honor the original number for that customer (one-time goodwill); update disclaimer copy; add explicit "subject to confirmation" language across the flow |
| CRA build breaks on Netlify Node bump | LOW (one weekend) | Pin `NODE_VERSION` in `netlify.toml`; lock to last working Node; document the band; schedule Vite migration |
| `npm audit` flags exploited CVE in CRA dep tree | MEDIUM | Check if affected code is in actual runtime path (most CRA CVEs are in build-time only). If runtime: emergency Vite migration. If build-time only: document in `CONCERNS.md`, keep moving. |
| Wrong abstraction emerges between `/styles` and `/3d-printing` | MEDIUM | Inline the abstraction back into both pages; restore explicit duplication; revisit only when third instance arrives |
| Sanity schema mistake (e.g., picked wrong field shape) | LOW–MEDIUM depending on volume | Sanity supports schema migrations via CLI; staging dataset (which is why having one matters) lets you test before it hits prod content |
| Spam volume becomes unmanageable | LOW | Enable Netlify form spam detection; add reCAPTCHA v3; auto-archive submissions with empty subject or boilerplate body |
| File upload accepts something malicious | HIGH | Take the upload service offline; rotate any tokens/keys; review logs; document incident; tighten validation; communicate to affected users if any |
| Shop platform decision turns out to be wrong | HIGH | Stripe Checkout transactions are portable; Sanity catalog data exports to JSON; product images already in Sanity. Migration cost is rebuilding cart UI, not data. Avoid Buy-Button-style HTML embeds because data is locked into vendor. |
| Photos look amateur and undermine trust | MEDIUM | Schedule a 2-hour photo session with the new H2D + laser; reshoot top 6 hero items with consistent lighting and background. Photos > everything else for "looks legit." |
| Spruce ships incomplete (some pages still old) | LOW | Use the route-checklist above; do a single-PR sweep with `git diff` showing token changes; reviewer's job is to catch any visual diff. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Auto-quote diverges from reality | Bundle 2 | Disclaimer copy is in the UI; estimate is a range; manual confirmation gate exists; no path from upload → payment without owner step |
| 2. CRA dependency rot | Bundle 1 (mitigation), pre-Bundle 3 (Vite migration) | `.nvmrc` committed; `netlify.toml` pins `NODE_VERSION`; `pnpm-lock.yaml` committed; smoke-build runs weekly |
| 3. `/3d-printing` and `/styles` drift / wrong abstraction | Bundle 1 (duplicate freely), Bundle 3 (revisit) | Two parallel files exist; no `serviceType` parameter switches in shared code; decision documented in `PROJECT.md → Key Decisions` |
| 4. Half-spruce | Bundle 1 | Route checklist passed; no hardcoded hex values in JSX; no untouched-since-spruce pages |
| 5. Spam protection | Bundle 1 (honeypot fix), pre-Bundle 2 (reCAPTCHA) | Honeypot is visually hidden; relative form action URL; Netlify form-spam detection enabled in dashboard; reCAPTCHA token is server-verified before Bundle 2 ships |
| 6. File-upload UX | Bundle 2 | Validation up-front; progress indicator; drop zone with hover state; file replacement without reload; localStorage persistence of form state |
| 7. File-upload security | Bundle 2 | Files routed through scanning asset service; SVG sanitization with DOMPurify; STL parsing memory-bounded; owner never opens raw uploaded files locally |
| 8. Sanity schema sprawl | Bundle 1 (introduce `useSanityQuery` + composite GROQ), ongoing | Single fetch hook used by all Sanity calls; home page issues ≤ 2 Sanity requests on first paint; image URL builder used everywhere |
| 9. Local SEO + photography | Bundle 1 | Per-page meta + JSON-LD `LocalBusiness` shipped; sitemap.xml generated at build; photo session completed; alt text bound from Sanity |
| 10. Shop platform paralysis | Bundle 3 (1-week discovery sub-phase) | Discovery doc fits one page; default = Stripe Checkout + Sanity catalog unless surprises; tax registration limit documented; cart state model decided |

---

## Sources

**Codebase audit (primary, HIGH confidence):**
- `.planning/PROJECT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/STACK.md`

**CRA deprecation + migration (HIGH confidence — official sources confirm):**
- [Create React App officially deprecated — Socket.dev](https://socket.dev/blog/create-react-app-officially-deprecated)
- [React team formally deprecates Create React App — DevClass](https://www.devclass.com/development/2025/02/18/react-team-formally-deprecates-create-react-app-following-perfect-storm-of-incompatibility/1631009)
- [CRA breaks with React 19 — facebook/create-react-app#17004](https://github.com/facebook/create-react-app/issues/17004)
- [Fixing OpenSSL legacy provider in old React projects](https://medium.com/@temptushar1/fixing-the-unsupported-openssl-error-in-react-apps-with-node-js-18-00690617a446)

**3D printing / quoting (MEDIUM confidence — vendor sources, cross-checked):**
- [Quot3D — uses real slicer profiles](https://get-quot3d.com/)
- [PartPilot — guaranteed ±5% accuracy claim](https://www.part-pilot.com/)
- [i.FacFox instant quote — explicit "may not be final" disclaimer](https://i.facfox.com/insta3dp/)
- [DigiFabster quoting platform](https://digifabster.com/)
- [Build Your Own 3D Printing Quote Tool — NEXT 3DP](https://www.next3dp.com/build-your-own-3d-printing-quote-tool)

**STL/3D-file security (MEDIUM-HIGH confidence — academic sources):**
- [Steganographic Attacks on 3D Printing Files — ACM](https://dl.acm.org/doi/fullHtml/10.1145/3471621.3471843)
- [Cyber-physical vulnerabilities in additive manufacturing — researchers](https://www.researchgate.net/publication/317153284_Cyber-physical_vulnerabilities_in_additive_manufacturing_systems_A_case_study_attack_on_the_STL_file_with_human_subjects)
- [Comprehensive Threat Landscape in Additive Manufacturing](https://insidemetaladditivemanufacturing.com/2024/09/25/comprehensive-threat-landscape-in-additive-manufacturing-understanding-cyber-physical-vulnerabilities/)

**File upload UX (MEDIUM confidence — multiple consistent sources):**
- [File Uploader UX best practices — Uploadcare](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Drag-and-Drop UX Guidelines — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)
- [Designing an Intuitive Document Upload UI — Filestack](https://blog.filestack.com/designing-an-intuitive-document-upload-ui/)

**Sanity scaling (HIGH confidence — official docs):**
- [High performance GROQ — Sanity Docs](https://www.sanity.io/docs/high-performance-groq)
- [GROQ query guide clean patterns — Robotostudio](https://robotostudio.com/blog/clean-your-groq)
- [GROQD — scaling type-safe GROQ queries — Nearform](https://nearform.com/digital-community/groqd-introduction/)

**E-commerce on SPA / platform comparison (MEDIUM confidence):**
- [Stripe Checkout vs Snipcart comparison](https://snipcart.com/blog/stripe-checkout-form-integration-vs-snipcart)
- [Shopify Buy Button vs Snipcart](https://snipcart.com/blog/snipcart-vs-shopify-buy-button-review)
- [Stripe Tax + Checkout setup gotchas](https://docs.stripe.com/tax/checkout)
- [Stripe shipping address `customer_update` configuration](https://docs.stripe.com/payments/checkout/taxes)

**Premature abstraction (HIGH confidence — canonical sources):**
- [The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
- [How to avoid premature abstractions in React — falldowngoboone](https://www.falldowngoboone.com/blog/how-to-avoid-premature-abstractions-in-react/)
- [WET vs AHA — avoiding premature abstraction in frontend](https://www.codewithseb.com/blog/wet-vs-aha-avoiding-premature-abstraction-in-frontend-development)

**Design tokens / theme drift (MEDIUM confidence):**
- [Design Tokens that Scale — Mavik Labs](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
- [How to Build a Design Token System for Tailwind that Scales](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)

**Conversion + small-shop pricing (MEDIUM confidence):**
- [Pricing Page Best Practices — Userpilot](https://userpilot.com/blog/pricing-page-best-practices/)
- [Website Mistakes Costing Ecommerce — eCommerceFastlane](https://ecommercefastlane.com/website-mistakes-costing-ecommerce-stores-conversions/)
- [Website Design Mistakes That Kill Conversions](https://www.esignwebservices.com/blog/5-website-design-mistakes-that-kill-conversions/)

---

*Pitfalls research for: small maker-studio site (laser + 3D printing) on CRA + Sanity + Netlify*
*Researched: 2026-05-02*
