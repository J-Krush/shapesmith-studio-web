# Phase 5 User Acceptance Test

> **Read first.** This is the owner-side UAT script for closing Phase 5 — the Pre-Made Goods Shop. Walk through Tests 1–5 in order on the **deploy preview** (NOT production). Each test maps to one of the 5 SHOP-03..07 requirements. Mark every checkbox PASS or FAIL; record any failures in the "Failures and follow-ups" section at the bottom.

**Time required:** ~30 minutes
- Test 1 (SHOP-03): 1 min — doc check
- Test 2 (SHOP-04): 5 min — owner edit a product, verify the storefront updates
- Test 3 (SHOP-05): 8 min — catalog grid, filter pills, detail page, mobile sticky bar
- Test 4 (SHOP-06): 12 min — JSON crawler curl smokes + test purchase round-trip + email check + price-tampering negative test
- Test 5 (SHOP-07): 4 min — sold-out and low-stock UI states

**Phase:** 05-pre-made-goods-shop
**Plan:** 05-08
**Created:** 2026-05-09

---

## Prerequisites

- [ ] All sections A–E of `05-OWNER-PREP-CHECKLIST.md` complete.
- [ ] At least 2 test products published in Sanity (one with `stockQuantity = 5`, one with `stockQuantity = 2`; optionally a third with `stockQuantity = 0`).
- [ ] Deploy-preview URL reachable; `/shop` renders the catalog grid (NOT Coming Soon).
- [ ] Browser DevTools open (you'll need it for Tests 4a curl smokes from a terminal AND for the price-tampering test in 4e).
- [ ] Inbox open (the studio email — for Test 4c email-receipt check).

**Variables to fill in before starting** (so the curl commands and clicks below "just work"):

| Var | Value |
|-----|-------|
| `<deploy-preview>` | the deploy-preview origin, e.g. `https://deploy-preview-42--shapesmith-studio.netlify.app` |
| `<published-slug>` | a real slug from your Sanity products, e.g. `oak-coaster-set` |
| `<low-stock-slug>` | the slug of the `stockQuantity = 2` product |
| `<sold-out-slug>` | the slug of the `stockQuantity = 0` product (if you published one) |

---

## Test 1 — SHOP-03: Platform decision artifact exists

**Acceptance criterion (REQUIREMENTS.md):** *A discovery sub-phase produces a written platform decision (Snipcart / Stripe+Sanity / Shopify Storefront) backed by SKU-count and ops-preference inputs; default is Snipcart unless decision overrides.*

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 1.1 | `.planning/phases/05-pre-made-goods-shop/05-CONTEXT.md` exists. | File present. | | ☐ |
| 1.2 | The file's `<decisions>` block contains **D-01** locking the platform to **Snipcart**. | `D-01` paragraph names Snipcart, cites Stripe+Sanity and Shopify Storefront as alternatives, gives SKU-count rationale (5–15 launch). | | ☐ |
| 1.3 | The file's `<decisions>` block contains **D-02** (catalog scale = 5–15 SKUs at launch). | `D-02 [informational]` present, names "5–15 SKUs". | | ☐ |
| 1.4 | The file's `<decisions>` block contains **D-03** (ops model = Minimal — manual USPS Click-N-Ship). | `D-03 [informational]` present, names manual fulfillment. | | ☐ |
| 1.5 | The file's `<decisions>` block contains **D-04** (shipping = flat-rate by region + local pickup). | `D-04 [informational]` present, names US flat / Canada flat / international "contact us" / local pickup. | | ☐ |

**Test 1 overall PASS / FAIL:** ☐

---

## Test 2 — SHOP-04: Owner can publish products via Sanity Studio

**Acceptance criterion (REQUIREMENTS.md):** *A `product` Sanity schema is finalized in discovery and supports the chosen platform; owner adds product documents per the schema spec.*

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 2.1 | Open Sanity Studio → "Product" → pick any published test product. Edit the `name` field (e.g. append " (UAT)"). Click Publish. | Edit saves; the published doc shows the new name in the Studio list view. | | ☐ |
| 2.2 | Wait ~30 seconds (CDN propagation) and reload `<deploy-preview>/shop`. | The product card on the grid shows the updated name. | | ☐ |
| 2.3 | In Sanity Studio, click into Product A. The schema form shows ALL fields from §2 of `05-PRODUCT-SCHEMA-SPEC.md`: `name`, `slug`, `description`, `body`, `price`, `stockQuantity`, `featured`, `dimensions`, `leadTime`, `images[]`, `materials[]`, `processes[]`, `seo`. | Every field is editable. `slug` shows auto-generate-from-name UI. `images[].altText` is a required field (Studio shows a validation marker). | | ☐ |
| 2.4 | Restore the product name to its original value. Publish. | Storefront reverts within ~30s. | | ☐ |

**Test 2 overall PASS / FAIL:** ☐

---

## Test 3 — SHOP-05: `/shop` catalog + `/shop/:slug` detail

**Acceptance criterion (REQUIREMENTS.md):** *Visitors can browse `/shop` and see a grid of pre-made goods (laser-cut + 3D-printed), with detail pages at `/shop/:slug`.*

### 3a. Catalog rendering

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 3.1 | Visit `<deploy-preview>/shop` on a desktop browser. | Page renders the catalog grid (NOT Coming Soon). | | ☐ |
| 3.2 | Resize the browser between mobile / tablet / desktop (or use DevTools device toolbar). | 1 column at < `sm` (~< 640px), 2 columns at `sm:` (640–1024px), 3 columns at `lg:` (≥ 1024px). | | ☐ |
| 3.3 | Each card shows the product hero image, name, and price (USD, e.g. `$35.00`). | Image fills the card; name + price below. | | ☐ |
| 3.4 | Click the **Laser** filter pill at the top of the grid. | Grid narrows to products with `processes` containing `laser`. | | ☐ |
| 3.5 | Click the **3D printed** filter pill. | Grid narrows to products with `processes` containing `print`. | | ☐ |
| 3.6 | Click the **All** filter pill. | Grid shows everything. | | ☐ |
| 3.7 | Visual check on filter pills: active pill background = `bg-accent` (blue, `#348bd8`), inactive pills background = `bg-ternary-dark`. | Active pill is the blue one. | | ☐ |

### 3b. Detail page rendering

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 3.8 | From `/shop`, click a product card. | URL becomes `/shop/<slug>`. Detail page renders. | | ☐ |
| 3.9 | The detail page shows: hero image (top/left), thumbnails (clickable), product name (H1), price, description (≤200 chars), Add to Cart button, body (rich portable-text content if populated; absent if not — both are valid), Details / spec table at the bottom. | Layout matches UI-SPEC §5 / 05-05-PLAN. | | ☐ |
| 3.10 | Click a thumbnail under the hero image. | Lightbox opens fullscreen. | | ☐ |
| 3.11 | Click the lightbox close button (✕). | Lightbox closes; user returns to detail page. | | ☐ |
| 3.12 | Pick a product whose `dimensions` field is empty (or temporarily clear it in Sanity, publish, reload). | The Details spec table does NOT render an empty Dimensions row. (Spec table omits empty fields gracefully — CONTEXT D-12.) | | ☐ |
| 3.13 | Pick a product whose `materials[]` array is populated. | Each material name appears as a clickable `<Link>` to `/styles#materials` or `/3d-printing#materials`. | | ☐ |
| 3.14 | If `materials[]` is empty, the Materials row does NOT render. | No empty Materials row. | | ☐ |

### 3c. Mobile sticky bar

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 3.15 | Open the detail page on a mobile viewport (< 768px wide). Use DevTools device toolbar if needed. | Page renders single-column. | | ☐ |
| 3.16 | Scroll DOWN past the in-content Add to Cart button. | A footer-pinned **sticky bar** appears with: product name + price + Add to Cart button. | | ☐ |
| 3.17 | Scroll BACK UP to the in-content Add to Cart button. | The sticky bar HIDES (the in-content button takes over). | | ☐ |
| 3.18 | On a desktop viewport (≥ 768px wide), scroll the same way. | The sticky bar NEVER appears (it's mobile-only). | | ☐ |

**Test 3 overall PASS / FAIL:** ☐

---

## Test 4 — SHOP-06: End-to-end purchase

**Acceptance criterion (REQUIREMENTS.md):** *Visitors can purchase one or more items end-to-end through the chosen platform's checkout flow; orders are received by the owner with all info needed to fulfill and ship.*

### 4a. JSON crawler endpoint smoke (curl from terminal)

> **Why this matters:** This is the security gate. Without the JSON crawler endpoint, browser-DevTools price tampering (Test 4e) would succeed silently. With it, Snipcart re-validates every order against this server-truth response. RESEARCH Pitfalls 1+2 are the rationale.

Run these `curl` commands in a terminal (replace placeholders with real values):

| # | Command | Expected | Actual | Pass / Fail |
|---|---------|----------|--------|-------------|
| 4.1 | `curl -i "<deploy-preview>/.netlify/functions/snipcart-validate-product?slug=<published-slug>"` | HTTP 200; `Content-Type: application/json`; body includes `id` (= slug), `name`, `price` (number), `description`, `image` (CDN URL), `stock` (integer matching Sanity). | | ☐ |
| 4.2 | `curl -i "<deploy-preview>/.netlify/functions/snipcart-validate-product?slug=does-not-exist"` | HTTP 404. | | ☐ |
| 4.3 | `curl -i "<deploy-preview>/.netlify/functions/snipcart-validate-product?slug=foo;bar"` | HTTP 400 (slug regex `^[a-z0-9-]+$` rejects `;`). | | ☐ |
| 4.4 | `curl -i -X POST "<deploy-preview>/.netlify/functions/snipcart-validate-product"` | HTTP 405 Method Not Allowed (GET-only). | | ☐ |

### 4b. Test purchase round-trip

> Use Stripe test card `4242 4242 4242 4242` exactly. Snipcart test mode is connected to Stripe's test environment — no real money moves.

| # | Step | Expected | Actual | Pass / Fail |
|---|------|----------|--------|-------------|
| 4.5 | On `<deploy-preview>/shop/<published-slug>`, click **Add to Cart**. | Snipcart cart drawer slides in from the right with the product line item: name, price, image, qty `1`. | | ☐ |
| 4.6 | Visual check on the cart drawer: dark background (`bg-primary-dark`), accent button color (`bg-accent`), GeneralSans / Proxima Nova typography. | Drawer styling matches the site's dark theme — NOT Snipcart's default white. | | ☐ |
| 4.7 | Click **Checkout** in the drawer. | Snipcart's hosted checkout page loads (URL changes to a Snipcart-hosted page; OK to be styled less polished than the cart drawer per CONTEXT D-14). | | ☐ |
| 4.8 | Fill in test customer info (any name, any test email — owner inbox preferred so you receive Snipcart's customer-confirmation email too). | All fields accept input; validation is reasonable. | | ☐ |
| 4.9 | Card: `4242 4242 4242 4242`, expiry `12/29`, CVC `123`, ZIP `90210`. Pick a shipping method (e.g. **USPS Standard $9** or **Local pickup $0**). | Snipcart accepts the test card. | | ☐ |
| 4.10 | Complete the order. | Snipcart shows the order success / confirmation page with an invoice number (e.g. `INV-XXXX`). | | ☐ |

### 4c. Owner emails arrive (within ~60 seconds)

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 4.11 | Check the owner inbox within 60 seconds of completing the test order. | TWO emails arrived. | | ☐ |
| 4.12 | **Email 1 — Snipcart default order-confirmation email.** Subject: typically `"You have received a new order"` or similar Snipcart-provided format. From: Snipcart's notification address. | Present. | | ☐ |
| 4.13 | **Email 2 — Custom Resend email** (sent by `netlify/functions/snipcart-order-webhook`). Subject format: `[Order INV-XXXX] N item(s) — $TOTAL` (per `formatOrderEmail.js`). From: the configured Resend `from` address. | Present. | | ☐ |
| 4.14 | The custom email body contains: customer **name**, **email**, **phone**, **shipping address** (line by line), each **line item** (name, qty, unit price, line total), order **total**, **shipping method** + shipping cost, **link to Snipcart dashboard order**. | All fields populated. | | ☐ |

### 4d. Snipcart dashboard + Netlify Function logs reflect the order

| # | Check | Expected | Actual | Pass / Fail |
|---|-------|----------|--------|-------------|
| 4.15 | Snipcart Dashboard → **Orders**. | The new test order is at the top of the list, status = "Test mode". | | ☐ |
| 4.16 | Snipcart Dashboard → **Webhooks** → click the order webhook → **Logs**. | A POST request to `/.netlify/functions/snipcart-order-webhook` shows HTTP **200** response from your endpoint. | | ☐ |
| 4.17 | Netlify Dashboard → site → **Functions** → `snipcart-order-webhook` → **Logs** (or live tail). | The recent invocation log shows the function ran without errors. The invoice number is visible in the logs (per RESEARCH §"Security Domain" — the only intentional PII log). | | ☐ |

### 4e. Tampered-price negative test (security check — CRITICAL)

> **Why this matters:** This is the proof that Plan 06's JSON crawler endpoint mitigates RESEARCH Pitfalls 1 + 2. If this check FAILS (the order goes through at $0.01), the JSON crawler is misconfigured and the shop is unsafe to launch live.

| # | Step | Expected | Actual | Pass / Fail |
|---|------|----------|--------|-------------|
| 4.18 | Visit `<deploy-preview>/shop/<published-slug>`. Open DevTools → **Elements** panel. Find the `<button class="snipcart-add-item">` element. | Button visible in the DOM with `data-item-*` attributes. | | ☐ |
| 4.19 | Edit the `data-item-price` attribute from the real value (e.g. `35.00`) to `0.01`. Click **Add to Cart**. | The cart drawer opens with the tampered $0.01 line item. | | ☐ |
| 4.20 | Click **Checkout**. Fill in test info. Use the same Stripe test card (`4242 4242 4242 4242`). Attempt to complete the order. | Snipcart's order-validation rejects the order. The customer sees a "We couldn't validate this order" message OR the order silently fails to complete. | | ☐ |
| 4.21 | Snipcart Dashboard → **Orders**. | NO new $0.01 order appears. (If a $0.01 order DID appear, the validation has bypassed — STOP, FAIL Test 4, and report the failure.) | | ☐ |

**Test 4 overall PASS / FAIL:** ☐

---

## Test 5 — SHOP-07: Inventory state reflected accurately

**Acceptance criterion (REQUIREMENTS.md):** *Inventory state (sold-out, low stock) is reflected in the storefront in a way that's accurate for the chosen platform.*

### 5a. Sold-out state

| # | Step | Expected | Actual | Pass / Fail |
|---|------|----------|--------|-------------|
| 5.1 | In Sanity Studio, set Product A's `stockQuantity = 0`. Publish. Wait ~30s, reload `<deploy-preview>/shop`. | Product A's grid card shows a **"Sold out" badge** in the top-left corner of the image. | | ☐ |
| 5.2 | Product A's grid card has a visual desaturation / grayed-out appearance. | Card visibly distinguished from in-stock cards (image grayed and/or overlay applied per CONTEXT D-16 + UI-SPEC). | | ☐ |
| 5.3 | Click into Product A's detail page. | The page renders normally — sold-out items still have detail pages (CONTEXT D-16: "good for inbound links + SEO"). | | ☐ |
| 5.4 | On the detail page, the **Add to Cart button is replaced** with a static `<span>Sold out</span>` element (cursor-not-allowed; no `snipcart-add-item` class). | Button is replaced; clicking it does NOT add to cart. | | ☐ |
| 5.5 | On mobile, the sticky-bottom bar shows "Sold out" instead of an Add to Cart button. | Sticky bar reflects the sold-out state. | | ☐ |

### 5b. Low-stock state

| # | Step | Expected | Actual | Pass / Fail |
|---|------|----------|--------|-------------|
| 5.6 | In Sanity Studio, set Product B's `stockQuantity = 2`. Publish. Wait ~30s, reload `<deploy-preview>/shop`. | Product B's grid card shows **"Only 2 left"** inline near the price (no urgency animation, no countdown — clean text per CONTEXT D-16). | | ☐ |
| 5.7 | Click into Product B's detail page. | The detail page also shows **"Only 2 left"** near the price. | | ☐ |
| 5.8 | The Add to Cart button on Product B is functional (it's NOT sold out; only LOW stock). | Click works; cart drawer opens. | | ☐ |
| 5.9 | Inspect the Add to Cart button in DevTools. Confirm `data-item-max-quantity="2"`. | Attribute present and matches `stockQuantity`. (RESEARCH Pattern 4: `data-item-max-quantity` on the buy button is the primary stock guard.) | | ☐ |

### 5c. Restore products before launch (housekeeping)

- [ ] In Sanity Studio, restore Product A and Product B to their original `stockQuantity` values (or values appropriate for live launch).
- [ ] Confirm the storefront updates (`/shop` cards no longer show "Sold out" / "Only N left").

**Test 5 overall PASS / FAIL:** ☐

---

## Failures and follow-ups

> Use this section to log any FAILs, blockers, or deferred items the owner discovers during UAT. The planner will route any failures to gap-closure plans (or accept-and-defer with rationale).

| Test ID | Step | What happened | Severity (block-launch / nice-to-fix / deferred) | Owner notes |
|---------|------|---------------|--------------------------------------------------|-------------|
|         |      |               |                                                  |             |

---

## Sign-off

- [ ] Test 1 (SHOP-03): PASSED.
- [ ] Test 2 (SHOP-04): PASSED.
- [ ] Test 3 (SHOP-05): PASSED.
- [ ] Test 4 (SHOP-06): PASSED.
- [ ] Test 5 (SHOP-07): PASSED.
- [ ] All 5 tests PASSED (or any FAILs are documented above with severity).
- [ ] Phase 5 ready for live-mode flip — see `05-OWNER-PREP-CHECKLIST.md` §F. (Owner discretion: flip in this session, defer to a separate launch session, or skip until the planner finalizes ROADMAP/REQUIREMENTS.)
- [ ] Reply **"UAT passed"** in the planner thread (with per-test results pasted in OR a link to this updated UAT.md), OR **"UAT FAILED — {test-id}: {short failure description}"** so the planner can route to gap closure.

---

*UAT script created: 2026-05-09 — Plan 05-08*
*Phase: 05-pre-made-goods-shop*
