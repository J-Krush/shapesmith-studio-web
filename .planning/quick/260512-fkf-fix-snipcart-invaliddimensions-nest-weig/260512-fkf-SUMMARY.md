---
phase: quick-260512-fkf
plan: 01
subsystem: shop/checkout
tags: [snipcart, netlify-functions, shop, hotfix, dimensions]
dependency-graph:
  requires:
    - "phase-05 plan-05: snipcart-validate-product Netlify Function (introduced top-level weight)"
    - "phase-05 plan-05: AddToCartButton emitting data-item-weight=5000"
  provides:
    - "Snipcart JSON crawler response shape that satisfies Snipcart's dimension-set validator"
  affects:
    - "Snipcart checkout flow (payment step at /api/cart/<id>/pay)"
tech-stack:
  added: []
  patterns:
    - "Nested-object echo for Snipcart dimension validation (`dimensions: { weight }`)"
key-files:
  created: []
  modified:
    - "netlify/functions/snipcart-validate-product/snipcart-validate-product.js"
decisions:
  - "Nest weight inside a `dimensions` object instead of returning it at the top level — per Snipcart support staff guidance in forum thread #454. Snipcart's order validator compares the cart's `data-item-*` dimension attributes against the JSON response's `dimensions` object as a SET; a top-level `weight` field is not seen as a dimension, so the validator reports 'no dimensions object present' and rejects the order with an InvalidDimensions failure (manifested as a 500 with empty body at app.snipcart.com/api/cart/<id>/pay)."
  - "Omit length/width/height from the dimensions object. The studio uses weight-only shipping and does not track package dimensions; Snipcart accepts a partial `dimensions` object as long as the cart's dimension SET matches the response's dimension set. Adding empty length/width/height would not improve correctness and would invite future drift if the cart button later starts emitting them."
  - "Do NOT touch the AddToCartButton (`data-item-weight=5000` at the top level on the button is correct). Snipcart's cart-side schema uses flat `data-item-weight`/`data-item-length`/... attributes; the nesting is exclusively a JSON-response-shape requirement."
  - "Do NOT touch the GROQ query — `weight` is already projected (line 102). The fix is purely a response-shape rearrangement after Sanity returns."
metrics:
  duration: "~7 minutes (incl. pnpm install in fresh worktree)"
  completed: "2026-05-12"
---

# Quick Task 260512-fkf: Fix Snipcart InvalidDimensions — Nest Weight Summary

Move `weight` from the top level of the `snipcart-validate-product` JSON response into a `dimensions: { weight }` object so Snipcart's order validator stops rejecting checkouts with "Crawled dimensions for item ... are invalid" (surfaced as a 500 at `/api/cart/<id>/pay`).

## Diagnosis

**Symptom (production):** Snipcart checkout failed at the payment step. The browser saw a 500 response with an empty body from `https://app.snipcart.com/api/cart/<uuid>/pay`.

**Root cause (Snipcart Developer Log):**

> "Crawled dimensions for item kinetic-sculpture are invalid. Cart contains (data-item-weight=5000 data-item-length= data-item-width=) and JSON document contains (dimensions: (weight, height, length, width):)"

Snipcart's order validator compares the cart's `data-item-*` dimension attributes against the JSON response's `dimensions` object as a SET. A top-level `weight` field on the JSON response reads as "no dimensions object present" — the sets don't match — and the order is rejected at validation time. The 500 at `/api/cart/<id>/pay` is the opaque outward manifestation.

**Authoritative source:** Snipcart support thread #454, "Adding data-item-weight causes product crawling error" — <https://support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454>. Snipcart staff fix: nest `weight` under `dimensions`.

**History:** Phase 5 commits `73b5fb7` and `c9d93e0` added `weight` at the top level based on older Snipcart docs that were ambiguous about nesting. This fix supersedes that placement.

## Exact Diff

In `netlify/functions/snipcart-validate-product/snipcart-validate-product.js` `responseBody`:

```diff
 		stock: result.stockQuantity,
-		// Weight echo — AddToCartButton emits data-item-weight from the same
-		// Sanity field; mismatch here would fail Snipcart's optional-field
-		// comparison and reject the order at validation time.
-		weight: result.weight ?? 0,
+		// Dimensions — Snipcart REQUIRES weight to be nested inside a `dimensions`
+		// object, NOT returned at top level. When data-item-weight is set on the
+		// cart button, Snipcart compares the cart's dimension-set vs the JSON
+		// response's dimension-set; a top-level `weight` field reads as "no
+		// dimensions object present" and triggers an InvalidDimensions failure,
+		// surfaced opaquely as a 500 with empty body at
+		// app.snipcart.com/api/cart/<id>/pay during checkout. Confirmed by
+		// Snipcart staff in support thread #454:
+		// https://support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454
+		// Length/width/height are independent attributes (used for volumetric
+		// shipping); the studio doesn't track package dimensions, so weight-only
+		// is correct here.
+		dimensions: { weight: result.weight ?? 0 },
 	};
```

- 1 file changed, 13 insertions(+), 4 deletions(-).
- AddToCartButton untouched.
- GROQ query untouched (`weight` was already projected on line 102).
- No length/width/height fields introduced.
- Stock guard, optional image field, URL construction, error handling all unchanged.

## Tasks

| Task | Name | Status | Commit |
| ---- | ---- | ------ | ------ |
| 1 | Nest weight under `dimensions` in validate-product response body | DONE | `bcc76e4` |
| 2 | Manual verification — Snipcart test checkout completes without dimensions error | PENDING OWNER ACTION | — |

## Verification

**Automated checks (all pass on commit `bcc76e4`):**

1. `grep -nE 'dimensions:\s*\{\s*weight:\s*result\.weight\s*\?\?\s*0\s*\}' netlify/functions/snipcart-validate-product/snipcart-validate-product.js` →
   `173:		dimensions: { weight: result.weight ?? 0 },`  PASS

2. `! grep -nE '^\s*weight:\s*result\.weight\s*\?\?\s*0,\s*$' netlify/functions/snipcart-validate-product/snipcart-validate-product.js` →
   No matches. PASS (no remaining top-level weight line)

3. `grep -nF 'support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454' netlify/functions/snipcart-validate-product/snipcart-validate-product.js` →
   `169:		// https://support.snipcart.com/t/adding-data-item-weight-causes-product-crawling-error/454`  PASS

4. `pnpm build` → exits 0. Vite build completes; `postbuild` sitemap generator runs successfully. PASS

5. `git diff --name-only HEAD~1 HEAD` → `netlify/functions/snipcart-validate-product/snipcart-validate-product.js` only. PASS (AddToCartButton.jsx untouched, GROQ untouched)

**Note on build tool:** CLAUDE.md still references Create React App with `--openssl-legacy-provider`; the repo has since migrated to Vite (`vite build`, no legacy provider flag). The build script in `package.json` is now `vite build`. This is out-of-scope for this hotfix but worth noting for future stack-doc refresh.

## Pending Owner Action — Task 2 (human-verify checkpoint)

The Netlify Function will not pick up this change until the dev branch redeploys. Once Netlify reports the deploy preview (or production deploy, owner's choice) is live, the owner needs to re-run the test checkout on shapesmith.studio (or the deploy preview URL):

1. (Optional sanity) Hit `/.netlify/functions/snipcart-validate-product?slug=<known-product-slug>` directly and confirm the JSON body contains `"dimensions":{"weight":<number>}` — NOT a top-level `"weight"` field.
2. Open the Snipcart Dashboard → Developer Log (Account → Developer Log). Take a baseline.
3. From the live site, add a product to cart (e.g. `/shop/kinetic-sculpture`), open the Snipcart drawer, click through to the payment step, and complete the test order with Snipcart's test card `4242 4242 4242 4242` (any future expiry, any CVC).
4. **Expected outcomes (all must hold):**
   - No 500 from `app.snipcart.com/api/cart/<uuid>/pay`.
   - The order appears in Snipcart Dashboard → Orders.
   - The Snipcart Developer Log shows a successful validate-product entry — NO "Crawled dimensions for item ... are invalid" line.
   - The order detail in Snipcart Dashboard shows the item's weight correctly (5000 g for kinetic-sculpture, or whatever the Sanity `weight` field is set to).
5. **If validation still fails:** Capture the exact Snipcart Developer Log line and inspect the response body at `/.netlify/functions/snipcart-validate-product?slug=<failing-slug>` to confirm the `dimensions` field shape actually deployed.

**Resume signal:** Owner replies "approved" once the test checkout completes cleanly and the Snipcart Developer Log shows no dimensions error. If validation still fails, paste the Snipcart log line and the JSON response body to iterate.

## Deviations from Plan

None of the Rule 1–4 deviation types triggered. Plan executed exactly as written:

- Code change applied verbatim per the orchestrator's `<exact_change>` block.
- Inline comment cites Snipcart support thread #454 and explains both the set-comparison rationale and the weight-only-shipping rationale.
- All four automated verification gates pass.
- Single atomic commit, single file changed.

**Side note (not a deviation):** The worktree was empty (`node_modules` not present), so `pnpm install --frozen-lockfile` ran once before `pnpm build`. The lockfile was honored; no dependency changes were committed.

## Known Stubs

None. The `dimensions` object intentionally contains only `weight` — height/length/width are not stubbed-out empty values; they are deliberately omitted per the project's weight-only shipping model, which is documented in the inline comment.

## Threat Flags

None. The change is shape-only on data that was already being returned to Snipcart's public crawler endpoint. No new network surface, no new auth path, no new file access pattern, no new schema trust boundary. The endpoint remains anonymously readable by design (Sanity CDN + public product data).

## Self-Check: PASSED

- Commit `bcc76e4` exists on branch `worktree-agent-a519e8bdfb543f5a5`: `git log --oneline | grep bcc76e4` → FOUND.
- File `netlify/functions/snipcart-validate-product/snipcart-validate-product.js` exists and contains `dimensions: { weight: result.weight ?? 0 }` on line 173: FOUND.
- File contains the Snipcart support thread #454 URL on line 169: FOUND.
- No remaining top-level `weight: result.weight ?? 0,` line in the file: CONFIRMED.
- `pnpm build` exit code 0: CONFIRMED.
- Only one file in the commit diff (the Netlify function): CONFIRMED — `git diff --name-only HEAD~1 HEAD` returns one line.
