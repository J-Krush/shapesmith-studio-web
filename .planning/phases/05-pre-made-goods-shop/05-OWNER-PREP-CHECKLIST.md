# Phase 5 Owner-Prep Checklist

> **Read first.** This is the owner-side configuration checklist for closing Phase 5 — the Pre-Made Goods Shop. Work through sections A → E in order. Section F (live-mode flip) is optional and runs ONLY after `05-UAT.md` passes end-to-end on the deploy preview. Sections A and B can run in parallel (Sanity vs. Snipcart are unrelated tools); section C blocks on B; section E blocks on C.

**Time required:** ~60 minutes
- Sanity schema apply + 1–2 test products: ~15 min
- Snipcart account creation + dashboard config (shipping rates + webhook + 2FA + email): ~25 min
- Code-side test-mode key paste + commit + Netlify rebuild wait: ~10 min
- Netlify env-var verification + deploy-preview smoke: ~10 min

**Phase:** 05-pre-made-goods-shop
**Plan:** 05-08
**Created:** 2026-05-09

**Phase 5 deliverables this checklist activates:**
- `index.html` (Plan 05-03) — Snipcart `<div id="snipcart" data-api-key="...">` + script tag
- `src/css/snipcart.css` (Plan 05-03) — cart-drawer dark theme
- `src/context/ShopContext.jsx` + `SingleProductContext.jsx` (Plan 05-03)
- `src/pages/Shop.jsx` (Plan 05-04) — auto-flip catalog vs. Coming Soon
- `src/pages/ShopSingle.jsx` (Plan 05-05) — `/shop/:slug` detail page
- `netlify/functions/snipcart-validate-product/` (Plan 05-06) — JSON crawler endpoint
- `netlify/functions/snipcart-order-webhook/` (Plan 05-07) — order webhook → Resend

---

## A. Sanity Studio — apply the `product` schema

> **Why:** Plans 05-03 through 05-07 are coded against the schema in `.planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md`. Until the schema is deployed and at least one `product` document is published, the deploy preview's `/shop` will render the Coming Soon page (the empty-state fallback per CONTEXT D-13), and the `/shop/:slug` detail page is unreachable.

### A.1 Add the schema in the Sanity Studio repo

- [ ] Open the Sanity Studio repo (separate from this web repo).
- [ ] Add `schemas/product.js` (or `.ts` if Studio is TypeScript) using the `defineType` block from `.planning/phases/05-pre-made-goods-shop/05-PRODUCT-SCHEMA-SPEC.md` §2.
- [ ] Register the new type in `schemas/index.js` (add `import product from './product'` and append `product` to the `schemaTypes` array).

### A.2 Verify locally

- [ ] Run `sanity dev` (or `pnpm dev` / `npm run dev`, whatever the Studio repo uses).
- [ ] Open the local Studio. Confirm:
  - "Product" appears in the schema list (left sidebar).
  - "Product" appears in the "+ Create" menu.
  - Opening the create form shows all fields from §2 of the spec with the inline descriptions.

### A.3 Deploy the schema to production Sanity

- [ ] Run `sanity deploy` from the Studio repo. Wait for the deploy to complete.
- [ ] Open the production Studio (`https://<studio-name>.sanity.studio`).

### A.4 Publish at least 2 test products

Each product needs (per `05-PRODUCT-SCHEMA-SPEC.md` §6):
- `name` (required, 2–100 chars)
- `slug` (auto-generated from name, can override)
- `description` (required, ≤200 chars)
- `price` (required, number, 2 decimals)
- `stockQuantity` (required, integer ≥ 0)
- `images[]` (required, 1–6, each with `altText`)
- `processes[]` (required, ≥1 reference to existing process enum doc — `laser` and/or `print`)

Suggested test products (the UAT script in `05-UAT.md` references these):

- [ ] **Product A — normal stock + laser:** `stockQuantity = 5`, `processes = [laser]`, 2+ images, hero+1.
- [ ] **Product B — low stock + 3D-printed:** `stockQuantity = 2`, `processes = [print]`, 1+ images. (For the "Only 2 left" UI test.)
- [ ] *(Optional but recommended)* **Product C — sold out + laser:** `stockQuantity = 0`, `processes = [laser]`, 1+ images. (For the sold-out badge + disabled Add to Cart UI test.)

Leave `featured`, `dimensions`, `leadTime`, `materials`, `body`, `seo` empty initially — the storefront falls back gracefully and verifying the empty-field fallbacks is part of UAT Test 3b.

### A.5 Sanity Vision verification (smoke check)

- [ ] In production Studio, open the **Vision** plugin (left sidebar).
- [ ] Run this query against the `production` dataset:

  ```groq
  *[_type == "product" && !(_id in path("drafts.**"))]
    | order(featured desc, _createdAt desc){
      _id, name, "slug": slug.current, price, stockQuantity,
      "processes": processes[]->key,
      images[]{ altText, asset->{ url } }
    }
  ```

- [ ] Confirm the returned array contains your published test products with:
  - `slug` resolved to a kebab-case string
  - `processes` resolved to `["laser"]` and/or `["print"]` strings (NOT references — pay attention here)
  - `images[].asset.url` populated (asset URLs from Sanity CDN)
  - `images[].altText` non-empty on every image

If any of those are missing, the schema field references are likely off — recheck §2 of the spec.

---

## B. Snipcart — create account + configure dashboard

> **Why:** Snipcart is the platform decision (CONTEXT D-01). Without an account, no public API key exists, so the cart on the deploy preview won't initialize. Without shipping rates and the order webhook, a test purchase can't complete the way the storefront expects.

### B.1 Create the account

- [ ] Go to https://app.snipcart.com/register.
- [ ] Sign up with the studio email (the same inbox where the order emails should land — owner discretion).

### B.2 Enable 2FA (security best practice)

- [ ] Snipcart Dashboard → **Account → Security** → enable 2-factor authentication.
- [ ] Store the 2FA backup codes somewhere safe (password manager).

### B.3 Verify the pricing tier (RESEARCH assumption A1)

- [ ] Snipcart Dashboard → **Account → Plan**.
- [ ] Confirm the pricing structure matches what RESEARCH §"Summary" assumed:
  - Free below the monthly revenue threshold (research cited "$1k/month" — verify the actual number in your dashboard).
  - 2% commission on top of Stripe's 2.9% + 30¢ above the threshold.
- [ ] If the pricing differs materially from the assumption, raise it as a blocker before continuing — the platform decision in CONTEXT D-01 was scoped against this pricing model.

### B.4 Copy API keys

- [ ] Snipcart Dashboard → **Account → API Keys**.
- [ ] You'll see two keys: **test-mode public API key** and **live-mode public API key**.
- [ ] Copy the **test-mode public API key** to your clipboard. (You'll paste this in section C.)
- [ ] Note the **live-mode public API key** for later — DO NOT use it until UAT passes (section F).

> **Public vs. secret keys:** Snipcart's "public API key" is browser-exposed by design — committing it in `index.html` is intentional and safe. Phase 5 does NOT require a secret API key (RESEARCH §"Environment Availability" — A3 confirmed the webhook-validation endpoint is unauthenticated).

### B.5 Configure shipping rates (CONTEXT D-04)

Snipcart Dashboard → **Shipping → Add Method**. Add these four methods (rate values are owner discretion — the values below are recommended starting points):

- [ ] **Method 1 — USPS Standard:** flat rate **$9.00**, region: **US**. (Recommend USPS Ground / Priority — owner judgment based on actual dropoff workflow.)
- [ ] **Method 2 — Canada Standard:** flat rate (e.g. **$19.00**), region: **Canada**. (Owner picks the rate — Canada Post + USPS-international handoff costs vary.)
- [ ] **Method 3 — International "contact us":** Use Snipcart's region-restriction setting to **disallow checkout outside US + Canada**. The custom message should direct international visitors to the `/contact` form. (CONTEXT D-04 — international is "contact us" only.)
- [ ] **Method 4 — Local pickup at studio:** **$0.00** custom shipping method, region: **US** (since the studio is in the US). Snipcart supports `$0` rates per their support docs.

### B.6 Subscribe to the order-completed webhook (CONTEXT D-15)

Snipcart Dashboard → **Webhooks → Add endpoint**.

- [ ] **URL:** `https://shapesmith.studio/.netlify/functions/snipcart-order-webhook`
  - For deploy-preview testing, use the deploy-preview URL: `https://deploy-preview-<N>--<site-name>.netlify.app/.netlify/functions/snipcart-order-webhook` and switch back to the production URL before launch.
  - **OR** keep the production URL and accept that test-mode UAT orders won't trigger the custom Resend email until the dev branch merges. Owner judgment.
- [ ] **Events:** subscribe to `order.completed` ONLY. Do NOT subscribe to all events — the function rejects non-`order.completed` events with a 200 OK to avoid Snipcart's retry loop, but un-needed event subscriptions just waste latency.

### B.7 Enable Snipcart's default order email

- [ ] Snipcart Dashboard → **Notifications**.
- [ ] Confirm the **default order-completed email** to the merchant (owner) is enabled.
  - This is Snipcart's built-in email — separate from the custom Resend email Plan 05-07's webhook sends.
  - Per CONTEXT D-15, the owner receives BOTH emails. The Snipcart email contains the standard receipt; the Resend email contains the custom-formatted "fulfill this order" view.

---

## C. Code-side — paste the test-mode public API key

- [ ] Open `index.html` at the repo root (post-Phase 4 location).
- [ ] Find the line:

  ```html
  <div hidden id="snipcart" data-api-key="REPLACE_WITH_SNIPCART_TEST_PUBLIC_KEY"></div>
  ```

- [ ] Replace the placeholder `REPLACE_WITH_SNIPCART_TEST_PUBLIC_KEY` with the actual **test-mode public API key** copied in B.4.
- [ ] Commit:

  ```bash
  git add index.html
  git commit -m "feat(05): paste Snipcart test-mode public key into index.html"
  ```

- [ ] Push to the **dev branch** (or whichever branch deploys to the Netlify deploy-preview environment per the project's git workflow — see global memory `git_workflow.md`).
- [ ] Wait for Netlify to finish the deploy-preview build (1–3 min). Watch the build log if you want to confirm Vite finished without errors.

> **Why a code commit (not an env var)?** Phase 5 RESEARCH Open Question 2 (RESOLVED) committed to "hardcode test key in `index.html`; document live-key swap as a single-line code edit + commit at launch". Pattern 4 (`vite.config.js transformIndexHtml`) was deferred as a possible Phase 5.1 polish if the per-launch commit becomes painful.

---

## D. Netlify dashboard — verify env vars

- [ ] Netlify Dashboard → site → **Site Settings → Build & Deploy → Environment**.
- [ ] Confirm `RESEND_API_KEY` is **set** (it should already exist from Phase 3 owner-prep, Plan 03-03).
  - If missing: copy it from Resend Dashboard → API Keys, then add it as a Netlify env var. Trigger a redeploy after adding.
- [ ] Confirm there are **no other env vars required for Phase 5**. Specifically, the following are NOT needed:
  - `SNIPCART_API_SECRET` — RESEARCH A3 confirmed the webhook-validation endpoint is unauthenticated.
  - `VITE_SNIPCART_PUBLIC_KEY` — Phase 5 hardcoded the test key in `index.html` instead (RESEARCH Open Question 2 resolved).

---

## E. Deploy preview — smoke check

- [ ] After section C's commit lands, wait for the Netlify deploy-preview build to finish.
- [ ] Open the deploy-preview URL.
- [ ] Visit `/shop`. Confirm:
  - The catalog grid renders (NOT the Coming Soon page) — at least your test products from section A appear.
  - The browser network tab shows `cdn.snipcart.com/themes/v3.7.1/default/snipcart.js` loads with HTTP 200 (Snipcart script + theme CSS pulled from the pinned version).
- [ ] Open the browser console. There should be no JavaScript errors.
- [ ] Move on to UAT — open `.planning/phases/05-pre-made-goods-shop/05-UAT.md` and walk through Tests 1–5.

If `/shop` shows the **Coming Soon** page even though section A says you published products: the Sanity CDN cache may not have refreshed yet — wait ~30–60 seconds and reload. If it still doesn't appear, recheck section A.5 (the Vision query must show at least one non-draft `product` document).

---

## F. Launch (post-UAT — optional in this session)

> **Run this section ONLY AFTER `05-UAT.md` Tests 1–5 all pass on the deploy preview.**

### F.1 Swap the test key for the live key

- [ ] In `index.html`, replace the test-mode public key with the **live-mode public API key** (copied in B.4).
- [ ] Commit:

  ```bash
  git add index.html
  git commit -m "feat(05): swap Snipcart test→live key for production launch"
  ```

- [ ] Open a PR from the dev branch into master (per global memory `git_workflow.md` — never push directly to master).

### F.2 Snipcart dashboard — confirm webhook URL (live mode)

- [ ] Snipcart Dashboard → **Webhooks**. Confirm the order webhook URL points at the production URL: `https://shapesmith.studio/.netlify/functions/snipcart-order-webhook`. (If you used the deploy-preview URL during UAT, swap it back now.)

### F.3 Production deploy verification

- [ ] After the PR merges and Netlify deploys to production, open `https://shapesmith.studio/shop`. Confirm catalog renders.
- [ ] Run a real **$1 test purchase** with the owner's own card on a low-priced test product (e.g. set `stockQuantity = 1` on a $1 placeholder product). Verify:
  - The order arrives in your inbox (both Snipcart default email + custom Resend email).
  - The Snipcart dashboard shows the live order.
  - You can refund the test order from the Snipcart dashboard.
- [ ] After the live test purchase, raise the placeholder product's `stockQuantity` back / unpublish it.

### F.4 Set up your fulfillment workflow

- [ ] USPS Click-N-Ship: print labels for orders. (CONTEXT D-03 — manual fulfillment, ~10 min per order.)
- [ ] Email tracking links to customers manually after dropoff/pickup. (Snipcart's customer-facing email contains the order confirmation; you supply the tracking number out-of-band.)

---

## Sign-off

- [ ] Sections A–E complete. Deploy preview shows `/shop` catalog rendering.
- [ ] All UAT items in `05-UAT.md` PASSED.
- [ ] (Optional) Section F live-mode flip done; production verified with a $1 test purchase.

When sections A–E are complete and you're ready to run UAT, reply **"owner-prep complete, starting UAT"** to the planner thread.

When all of UAT and (optionally) section F are complete, reply **"UAT passed"** with the per-test results from `05-UAT.md` so the planner can finalize ROADMAP/REQUIREMENTS.

---

*Owner-prep created: 2026-05-09 — Plan 05-08*
*Phase: 05-pre-made-goods-shop*
