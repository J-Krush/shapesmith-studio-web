---
phase: quick-260512-fkf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - netlify/functions/snipcart-validate-product/snipcart-validate-product.js
autonomous: false
requirements:
  - SHOP-FIX-DIMENSIONS-01
must_haves:
  truths:
    - "Snipcart validation accepts the response (no 'Crawled dimensions are invalid' entry in dev log)"
    - "A test checkout on shapesmith.studio completes through Snipcart's payment step (no 500 at /api/cart/<id>/pay)"
    - "The validate-product response JSON nests weight under a `dimensions` object, matching the cart's data-item-weight attribute set"
  artifacts:
    - path: "netlify/functions/snipcart-validate-product/snipcart-validate-product.js"
      provides: "Snipcart JSON crawler endpoint with corrected weight nesting"
      contains: "dimensions: { weight"
  key_links:
    - from: "netlify/functions/snipcart-validate-product/snipcart-validate-product.js"
      to: "Snipcart order-validation crawler"
      via: "JSON response body shape — weight nested under `dimensions`"
      pattern: "dimensions:\\s*\\{\\s*weight"
---

<objective>
Fix the Snipcart "Crawled dimensions for item ... are invalid" validation failure (surfaced as a 500 at `app.snipcart.com/api/cart/<uuid>/pay`) by nesting `weight` inside a `dimensions` object in the JSON response returned by `snipcart-validate-product`.

Purpose: Snipcart compares the cart's `data-item-weight=5000` attribute set against the JSON response's dimension set. With `weight` at the top level the JSON response reads as "no dimensions object present", which doesn't match the cart's weight attribute and the order is rejected at validation time. Snipcart's own support staff confirmed the correct shape in their forum (thread #454).

Output: One updated response body shape in the validation function + an inline comment that documents the rationale and cites the Snipcart support thread.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@netlify/functions/snipcart-validate-product/snipcart-validate-product.js

<background>
**Diagnosis (Snipcart production dev log):**

> "Crawled dimensions for item kinetic-sculpture are invalid. Cart contains (data-item-weight=5000 data-item-length= data-item-width=) and JSON document contains (dimensions: (weight, height, length, width):)"

The error is Snipcart-side, not ours: Snipcart's validator expects a `dimensions` object in the JSON response that matches the cart's `data-item-*` dimension attributes. Top-level `weight` doesn't satisfy that check.

**Authoritative source:** Snipcart support thread #454 — "Adding data-item-weight causes product crawling error" — https://support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454. Snipcart staff fix: nest `weight` under `dimensions`.

**History:** Phase 5 commits (73b5fb7, c9d93e0) added `weight` at the top level; older Snipcart docs were ambiguous. This fix supersedes that placement.

**No button change needed:** `data-item-weight=5000` on the AddToCartButton is correct as-is. Length/width/height are not used (studio doesn't track package dimensions; weight-only shipping per Snipcart docs).

**Out of scope:** No length/width/height handling. No changes to AddToCartButton. No tests added (vitest scope excludes `netlify/` per project precedent — Phase 3 submit-quote.js + Plan 05-06 explicit allowance).
</background>

<current_code>
Current `responseBody` shape in `snipcart-validate-product.js` (lines 151-165):

```js
const responseBody = {
  id: result.id,
  name: result.name,
  price: Number(result.price),
  url: productUrl,
  description: result.description ?? '',
  // Stock guard — defensive secondary check for inventory race
  // (RESEARCH Pitfall 5; CONTEXT D-06 accepted trade-off).
  // Primary guard remains data-item-max-quantity on the AddToCartButton.
  stock: result.stockQuantity,
  // Weight echo — AddToCartButton emits data-item-weight from the same
  // Sanity field; mismatch here would fail Snipcart's optional-field
  // comparison and reject the order at validation time.
  weight: result.weight ?? 0,
};
```
</current_code>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Nest weight under `dimensions` in validate-product response body</name>
  <files>netlify/functions/snipcart-validate-product/snipcart-validate-product.js</files>
  <action>
In `netlify/functions/snipcart-validate-product/snipcart-validate-product.js`, change the `responseBody` (currently lines 151-165) so that `weight` is nested inside a `dimensions` object instead of appearing at the top level:

1. Replace the top-level `weight: result.weight ?? 0,` line with `dimensions: { weight: result.weight ?? 0 },`.

2. Update the inline comment block immediately above that field (currently lines 161-164, the "Weight echo — AddToCartButton emits data-item-weight..." comment) to reflect the correct nesting rationale. The new comment must:
   - Explain that Snipcart compares the cart's `data-item-*` dimension attributes against the JSON's `dimensions` object as a SET, not field-by-field.
   - Note that top-level `weight` reads as "no dimensions object present" and triggers Snipcart's "Crawled dimensions are invalid" rejection (manifested as a 500 at `/api/cart/<id>/pay`).
   - Cite Snipcart support thread #454 — "Adding data-item-weight causes product crawling error" — https://support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454 — as the authoritative source.
   - Mention that height/length/width are intentionally omitted because the studio uses weight-only shipping (no package-dimension tracking) — Snipcart accepts a partial `dimensions` object as long as the cart's dimension set matches.

3. Leave the rest of the response body, the GROQ query (which already selects `weight`), the stock field + its comment, the optional `image` field, and the function flow unchanged.

Do NOT touch the AddToCartButton (`data-item-weight=5000` at the top level on the button is correct). Do NOT introduce length/width/height handling. Do NOT modify the GROQ query — `weight` is already selected (line 102).
  </action>
  <verify>
    <automated>cd "/Users/krush/Projects/Shapesmith Studio/shapesmith-studio-web" &amp;&amp; grep -nE 'dimensions:\s*\{\s*weight:\s*result\.weight\s*\?\?\s*0\s*\}' netlify/functions/snipcart-validate-product/snipcart-validate-product.js &amp;&amp; ! grep -nE '^\s*weight:\s*result\.weight\s*\?\?\s*0,\s*$' netlify/functions/snipcart-validate-product/snipcart-validate-product.js &amp;&amp; grep -nF 'support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454' netlify/functions/snipcart-validate-product/snipcart-validate-product.js &amp;&amp; pnpm build</automated>
  </verify>
  <done>
- `responseBody` contains `dimensions: { weight: result.weight ?? 0 }` (nested, not top-level).
- No remaining top-level `weight: result.weight ?? 0,` line in the file.
- The inline comment above the dimensions field cites Snipcart support thread #454 and explains the set-comparison rationale + weight-only-shipping rationale.
- `pnpm build` exits 0 (no syntax errors, function still bundles).
- AddToCartButton untouched; GROQ query untouched; no length/width/height fields introduced.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual verification — Snipcart test checkout completes without dimensions error</name>
  <what-built>
The validate-product Netlify Function now returns `dimensions: { weight }` nested correctly so Snipcart's order-validation crawler stops rejecting orders at the payment step.
  </what-built>
  <how-to-verify>
After Task 1 lands and the deploy preview (or production deploy, owner's choice) is live:

1. **Local preview check (optional but recommended before deploy):**
   - Run `pnpm build && pnpm preview` (or hit the running dev server with the function emulated via `netlify dev` if installed).
   - Hit `/.netlify/functions/snipcart-validate-product?slug=<a-known-product-slug>` and confirm the JSON response body contains `"dimensions":{"weight":<number>}` — NOT a top-level `"weight"` field.

2. **Snipcart Dashboard — Developer Log:**
   - Open https://app.snipcart.com (TEST mode if using a test public key; LIVE mode if testing on production).
   - Navigate to Account → Developer Log (sometimes "Crawled Data" or "Order Validation" depending on Snipcart UI version).
   - Clear / take a baseline of the log before the next step.

3. **End-to-end test checkout:**
   - Visit shapesmith.studio (or the deploy preview URL).
   - Open a product detail page (e.g. /shop/kinetic-sculpture or whichever product previously failed).
   - Click "Add to cart".
   - Open the Snipcart drawer and click through to the payment step (Checkout → fill shipping/email → reach the payment screen).
   - Complete the test order with Snipcart's test card `4242 4242 4242 4242`, any future expiry, any CVC.

4. **Expected outcomes (all must hold):**
   - The payment step does NOT return a 500 from `app.snipcart.com/api/cart/<uuid>/pay`.
   - The order completes and appears in Snipcart Dashboard → Orders.
   - The Snipcart Developer Log shows the validate-product request and a SUCCESSFUL validation entry — NO "Crawled dimensions for item ... are invalid" line.
   - The order detail in Snipcart Dashboard shows the item's weight correctly (5000 g for kinetic-sculpture, or whatever the Sanity `weight` field is set to).

5. **If validation still fails:**
   - Copy the exact Snipcart Developer Log line and report it.
   - Inspect the response body at `/.netlify/functions/snipcart-validate-product?slug=<failing-slug>` to confirm the `dimensions` field shape made it through to the deployed function.
   - Confirm the deploy preview / production deploy actually picked up the new commit (Netlify deploy log shows the latest SHA).
  </how-to-verify>
  <resume-signal>
Reply "approved" once the test checkout completes cleanly and the Snipcart Developer Log shows no "Crawled dimensions are invalid" entry. If validation still fails, paste the Snipcart log line and the JSON response body so we can iterate.
  </resume-signal>
</task>

</tasks>

<verification>
- `grep -nE 'dimensions:\s*\{\s*weight:\s*result\.weight\s*\?\?\s*0\s*\}' netlify/functions/snipcart-validate-product/snipcart-validate-product.js` returns one match.
- `! grep -nE '^\s*weight:\s*result\.weight\s*\?\?\s*0,\s*$' netlify/functions/snipcart-validate-product/snipcart-validate-product.js` (no remaining top-level weight line).
- Inline comment cites `support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454`.
- `pnpm build` exits 0.
- AddToCartButton.jsx unchanged in this commit (`git diff --name-only HEAD~1 HEAD` shows only the function file).
- Snipcart Developer Log shows a successful validate-product entry for the test order; no "Crawled dimensions are invalid" line; test order completes through `/api/cart/<id>/pay` with no 500.
</verification>

<success_criteria>
- One atomic commit modifying only `netlify/functions/snipcart-validate-product/snipcart-validate-product.js`.
- The validate-product JSON response nests `weight` under a `dimensions` object.
- Inline comment explains the rationale + cites Snipcart support thread #454.
- A real test checkout on shapesmith.studio (or deploy preview) reaches the order-confirmation step without Snipcart raising "Crawled dimensions are invalid" and without a 500 at `/api/cart/<id>/pay`.
- AddToCartButton and the GROQ query are untouched.
- No length/width/height fields introduced.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-fkf-fix-snipcart-invaliddimensions-nest-weig/260512-fkf-SUMMARY.md` documenting:
- The diagnosis (Snipcart support thread #454, dev-log message).
- The exact diff (top-level `weight` → nested `dimensions: { weight }`).
- The Task 2 verification outcome (Snipcart dev log + completed test order screenshot / log line, if owner shares it).
- The commit SHA.
</output>
