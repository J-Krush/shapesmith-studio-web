<!-- refreshed: 2026-05-02 -->
# Feature Research

**Domain:** Local maker-studio service site (laser cutting + 3D printing) for hobbyists / small businesses
**Researched:** 2026-05-02
**Confidence:** HIGH for table stakes / anti-features (well-documented across competitor sites and lead-form research); MEDIUM for some differentiators where small-shop data is sparser than big-marketplace data.

## Audience Frame (do not lose sight of)

The visitor is **a local hobbyist or small-business owner**, not a professional industrial buyer. They:
- Want to know "can you make my thing, roughly how much, and how do I get it?"
- Decide based on **photos, vibe, and friction** before they decide on price
- Are *not* uploading a STEP file with chord-height tolerances — most don't even know what that is
- Will leave instantly if asked to make an account before seeing pricing or examples

This frame is what separates "table stakes for Shapesmith" from "table stakes for Xometry / SendCutSend." The big marketplaces' instant-quote-everything UX is a **distraction**, not a target — see Anti-Features.

## Bundle Mapping Key

The user has explicitly framed three bundles. Every feature below is mapped:
- **B1** — Spruce + 3D printing launch (ASAP)
- **B2** — Auto-pricing quote feature
- **B3** — Real shop (pre-made goods)
- **All** — relevant in every bundle as a baseline
- **—** — outside bundle scope

## Feature Landscape

### Table Stakes (Users Expect These)

Missing these = visitor doesn't trust the site is real, leaves.

| Feature | Why Expected | Complexity | Bundle | Sanity Support | Notes |
|---------|--------------|------------|--------|----------------|-------|
| Service overview pages (one per offering: laser, 3D print) | Visitor needs to confirm "yes, you do the thing I want." Mirrored grid + detail pages are the established pattern on the existing site. | LOW | **B1** | Existing `laser-style` schema covers laser; new `print-style` (or equivalent) schema needed for 3D printing — owner adds in Studio per spec | Mirror `/styles`. Detail pages tell the story per capability. |
| Photo-driven gallery / sample work | This is the #1 trust signal. "High-quality product photography is essential for converting browsers into buyers." Visitor wants to see what *you* have made, not what the machine *can* make. | LOW | **B1** | `laser-style` already has image arrays; mirror in `print-style`. Must degrade to placeholder blocks (no 3D-print photos exist yet — explicitly called out in PROJECT.md) | Placeholder strategy is critical for B1 because no real 3D-print samples exist. |
| Materials list (per service) | "Can you cut/print my thing in X?" is one of the top three pre-quote questions. Existing `/materials` route already serves this for laser. | LOW | **B1** | Existing `material` schema; needs a discriminator field (`forService: 'laser' \| 'print'` or similar) so the in-page section on each service can filter. Owner adds a tag/category to existing material docs. | PROJECT.md decision: materials become **in-page sections** on each service page, not a top-level route. Use a scroll-anchor link from the service page. |
| Clear "how to order / get a quote" path | Visitor needs to understand the next step in <5 seconds. Currently this is the contact form. | LOW | **B1** | No schema change — uses existing Netlify contact form | B1 enhancement: pre-fill the "service interested in" field based on referrer page (`/3d-printing` → 3D printing, `/styles` → laser). Already in PROJECT.md Active. |
| About / who we are | Trust signal. Single-person studio benefits enormously from a face + story. Already exists. | LOW | **B1** (refresh only) | Existing `profile` schema | Verify B1's hero refresh doesn't dilute the human-scale story. |
| Contact information visible without forms (email, location/area served) | Local audience. "Local" must be obvious. Many visitors will email rather than fill a form. | LOW | **B1** | Could live in `profile` or new `studio-info` singleton (recommend extending `profile`) | Add "Service area" / "Pickup available in [region]" copy somewhere in footer or contact page. |
| Functional, low-friction contact form | Visitor decides to reach out — form must work, not look spammy, not over-ask. Honeypot must be hidden (current bug). | LOW | **B1** | No schema change | PROJECT.md flags the visible honeypot as a known anti-pattern. Fix it in B1. |
| Turnaround time expectation | "When will I get it?" is in every customer's head. Competitors universally state lead times (e.g., Champion 3D = "2 working days standard, 1 day express"; SendCutSend = "2 business days for prototype"). | LOW | **B1** | Add a copy field to each service detail page, or a shared `studio-info` doc | Simple copy ("Most jobs ready in 1–2 weeks") is enough — don't over-promise. |
| Pickup / shipping clarity | Local customers care a lot whether they can pick up. Champion 3D's "pickup at our studio" is a frequently surfaced feature. | LOW | **B1** | Same as above — copy field on `studio-info` or service pages | Ties to "local" positioning. Competitive advantage if other local options don't offer pickup. |
| Mobile-responsive layout | Non-negotiable in 2026. Service searches happen on phones. | LOW (already done) | **All** | N/A | Verify on B1 spruce — hero refresh must hold up on mobile. |
| Working navigation (no dead links) | `/shop` exists in code as "Coming Soon" but isn't routed. Either ship it routed or remove it — a dead-link 404 destroys trust. PROJECT.md commits to shipping it as routed Coming Soon. | LOW | **B1** | No schema change | Already in PROJECT.md Active. |

### Differentiators (Competitive Advantage)

Features that win the booking once trust is established. Not all are equally valuable — pick selectively.

| Feature | Value Proposition | Complexity | Bundle | Sanity Support | Notes |
|---------|-------------------|------------|--------|----------------|-------|
| Customer project showcase / "what we made for X" with story | Etsy-commission research and small-laser-shop research both flag this: customer-context photos (not just product shots) build huge trust. The existing site's "Collaborations" section is the seed for this. | LOW–MEDIUM | **B1** | `collaboration` schema already exists — extend it or surface it more prominently in the spruce | Cheapest, highest-impact differentiator. Tell stories, not specs. |
| "What we won't make" / scope policy | Direct request from PROJECT.md framing. Sets expectation up front, filters out dead-end inquiries (gun parts, weapons, copyrighted, food-contact items, etc.). Reads as confident, not unfriendly. | LOW | **B1** | Add a copy field to the service page or a `studio-policy` Sanity singleton | Honest scope-setting > scope-bait. Local small-shop differentiator vs. big marketplaces that just say "no" after a quote. |
| Friendly, photo-led hero + nav refresh | Core value from PROJECT.md is "looks legit enough that the owner feels comfortable marketing it again." Visual confidence is itself a differentiator at this scale. | MEDIUM | **B1** | Hero copy/imagery via existing or new `home-hero` Sanity doc (currently hardcoded — recommend Sanity-ifying so owner can swap photos easily) | Single biggest perception lever for the relaunch. |
| Per-service materials section with anchor scroll + photos | Most local sites give a flat materials list. Tying material → service → example photo per material is more useful for hobbyists deciding. | LOW–MEDIUM | **B1** | Existing `material` schema + service tag (see Table Stakes row) | Anchor-link UX from each service page; section component can be shared. |
| FAQ section per service | Reduces inbound "is this possible?" emails. SendCutSend, 3DTomorrow, and most competitor sites have one. Hobbyists especially appreciate it. | LOW | **B1** (could slip to B2) | New `faq` Sanity schema (question, answer, service tag, order) — owner-editable | Cheap to ship. Strongly recommended for B1; only defer if hero/3D-printing-page work runs long. |
| Instant-quote calculator (file upload + ballpark) | The big-market killer feature. Shapeways/SendCutSend/Ponoko/Sculpteo/Xometry/Fabworks all converge on it. Done well, it eliminates the back-and-forth and converts browsers to bookers without a human gate. | **HIGH** | **B2** | New `pricing-rule` schema (per material: rate per unit time, rate per unit volume, setup fee). Heavy backend logic needed for parsing STL/SVG — will need a Netlify Function or external service. | This is *the* B2 feature. Don't build it in B1 (PROJECT.md decision); the contact form is the B1 placeholder. Be prepared to scope down to "ballpark by bounding box + material" if STL slicing is too complex. |
| File-validation feedback ("looks too thin to print", "open edges in your STL") | Premium 3D-print services (Shapeways, Sculpteo, Weerg) all do this. Reduces failed-print refunds and shows expertise. Hobbyist-friendly framing matters: "your walls look thin — here's a fix" beats "manifold error: chord deviation 0.04mm." | **HIGH** | **B2** | Out-of-band validation service (server-side STL parser, e.g., `three-stdlib` STLLoader + custom checks, or third-party API) | Pairs with instant quote. If quote is in B2, validation is the cherry on top. May be deferred within B2 if quote-only ships first. |
| Customer testimonials / reviews | Search results: "Customers check at least 3 reviews before making a purchase decision." Easy way to build trust without lots of original content. | LOW | **B1** (if owner has any) **or B2** | New `testimonial` Sanity schema (quote, author, optional project link) | Only ship if there's real material. Empty section is worse than no section. |
| "Designed for 3D printing" / design-tips content | Hobbyist audience often submits unprintable STLs from Thingiverse. A short, friendly tips page reduces failed jobs and positions the studio as expert. | LOW | **B1** late or **B2** | Could be a Sanity `design-tip` schema or just static copy | Low cost, high goodwill. Especially valuable since the owner has a Bambu H2D and presumably opinions about prep. |
| Before/after, in-progress, or video walkthrough content | Etsy-maker research strongly recommends behind-the-scenes content as a trust + connection signal. The existing OurProcess section is the seed. | LOW–MEDIUM | **B1** (refresh existing) | `maker-process` schema already exists | Could be expanded but doesn't need to be in B1 — a refresh is enough. |
| Response-time guarantee ("we reply within 1 business day") | Builds confidence in the contact-form path during B1 (before B2's instant quote exists). | LOW | **B1** | Copy field on contact page | Only commit to a window the owner will actually meet. |
| Pre-made goods shop | Already on the roadmap as B3. Etsy-style customer expectation that "if I like the maker, can I just buy something they already made?" Acts as both a sales channel and a portfolio. | **HIGH** | **B3** | New `shop-product` schema; full e-commerce decision (Shopify / Stripe / Snipcart per PROJECT.md) | Defer entirely to B3. PROJECT.md commits to "Coming Soon" landing in B1. |
| Service-specific landing page that pre-fills contact form | PROJECT.md already lists this for B1: visitor on `/3d-printing` who clicks Contact gets "service: 3D printing" pre-filled. | LOW | **B1** | No schema change — URL state + form default | Easy win. Already in plan. |
| File-format guidance per service ("we accept STL, OBJ, 3MF…") | Pre-emptively answers a common pre-quote question. Sits naturally in FAQ or as a callout on the service page. | LOW | **B1** | Copy on service detail page or FAQ | Pair with the "design tips" feature for compounding effect. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that *seem* obvious for a service site but actively hurt this audience or this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Account / login wall before pricing or examples | "Capture leads early!" | Lead-form research is unanimous: "Every additional form field reduces conversion by 10–15%." Account creation is the maximum form. Hobbyists will bounce; PROJECT.md is explicit "no auth, no logged-in experiences." | Public-read everything. Save the email ask for the contact/quote moment — when intent is highest. |
| Newsletter signup popup / aggressive lead capture | "Build the email list!" | Popup research: "Three popup mistakes — no value proposition, terrible timing, friction overload — drive conversion from a possible 8–15% down to 1–2% and erode trust." Hobbyist audience is allergic to this. | If newsletter exists at all, an unobtrusive footer signup with a clear value prop ("New styles in your inbox monthly"). Not a popup. Probably skip entirely for now. |
| Big-marketplace-style multi-step configurator (every option visible) | "Match what Xometry/Shapeways do." | Those flows are tuned for **professional buyers** uploading 100+ part STEP files. A hobbyist trying to get a name-sign engraved sees "select chord-deviation tolerance" and bounces. Configurator overwhelm is real. | Keep B2's quote tool radically simple: file → material picker → 1–2 options → ballpark price. "Designed for makers, not engineers." |
| Forced phone number on the contact form | "Phone numbers convert better!" | True for B2B SaaS. Not true for "I want a wedding sign engraved." Local hobbyists see a required phone field as overreach. | Keep phone optional. Email-only is fine; the studio owner can email back. |
| Heavyweight blog / articles | "SEO! Authority!" | PROJECT.md explicitly out-of-scope: "Blog / article content — not part of any current bundle." A blog requires upkeep the one-person studio doesn't have, and stale blogs read worse than no blog. | If content marketing matters later, do project-driven posts ("here's how we made the X") inside the existing collaboration / project structure, not a separate `/blog`. |
| Generic stock photography (laser machines, 3D printers, marketing shots from manufacturer) | "We need hero imagery and don't have shots yet." | Stock instantly tells a visitor "this site is generic." Local maker-shop differentiator dies on stock photo arrival. The whole reason the relaunch is happening is to *look real*. | Use placeholder blocks (already accepted in PROJECT.md as a degradation path). Owner photographs real work as it happens; UI degrades gracefully until then. |
| Live chat widget | "Reduce time-to-answer!" | One-person studio cannot staff live chat. An offline chat widget is worse than no chat — it signals dead-air. | "We reply within 1 business day" copy + good contact form. |
| Real-time inventory display before B3 ships | "Show people what's available!" | Without a real shop platform behind it, this is fake content that will go stale instantly. | "Coming soon" page for `/shop` per PROJECT.md. Don't tease specifics. |
| Configurable / customizable shop products in B3 | "Let customers personalize!" | PROJECT.md out-of-scope: "When shop ships, it sells pre-made goods only." Adding customization at launch quadruples B3 scope. | Sell pre-made goods first. Customization is a follow-on bundle if there's demand. |
| Aggressive cookie banner / tracking consent UI | "GDPR / privacy compliance!" | If no tracking is being done (the existing site uses no analytics or third-party cookies beyond Sanity CDN reads — verify), the banner is theater that hurts UX. | Only add a banner if and when analytics/marketing tracking is added. Otherwise omit. |
| Designer-spec sheet (chord deviation, kerf width, layer height, infill defaults) front and center | "Match the language of professional services." | PROJECT.md audience frame: "NOT a designer/maker spec sheet." This audience has never typed "kerf." | Keep specs in a dedicated "tech specs" or expandable section for the rare visitor who wants them. Lead with photos. |
| Multiple separate contact forms per service | "Customize the form per service!" | More forms to maintain, more places for fields to drift, more Netlify form names to wire up. PROJECT.md decision is to reuse the existing contact form with a pre-filled service field. | Single form, pre-filled subject/service field via referrer URL. |

## Feature Dependencies

```
[Photo gallery / sample work]
    └──requires──> [Service detail page (3D printing)]
                       └──requires──> [print-style Sanity schema]

[Materials in-page section]
    └──requires──> [material schema + service-tag field]
    └──requires──> [Service detail pages]

[Pre-fill contact form by referrer]
    └──requires──> [Existing contact form (Netlify Forms)]
    └──enhances──> [3D printing service page] [Laser/Styles service page]

[Coming Soon /shop route]
    └──requires──> [Routed page in App.js]
    └──seeds────> [B3 real shop]

[Instant-quote calculator (B2)]
    └──requires──> [Per-material pricing-rule data (Sanity schema)]
    └──requires──> [File-parsing capability (Netlify Function or service)]
    └──requires──> [Service detail pages already shipped (B1)]

[File-validation feedback (B2)]
    └──enhances──> [Instant-quote calculator]
    └──requires──> [STL/SVG parsing in B2 backend]

[Pre-made shop (B3)]
    └──requires──> [E-commerce platform decision]
    └──requires──> [shop-product Sanity schema OR platform-native catalog]
    └──conflicts──> [Customizable products at launch] (out of scope per PROJECT.md)

[FAQ per service]
    └──enhances──> [Service detail pages]
    └──reduces────> [Inbound contact-form noise]

[Customer project showcase]
    └──extends──> [Existing collaboration schema]
    └──enhances──> [Trust signal across both services]
```

### Dependency Notes

- **Service detail pages (3D printing) gate everything else in B1.** Photos, materials section, pre-fill form, FAQ — they all hang off the new `/3d-printing` route landing first.
- **Materials must get a service-tag in Sanity before the in-page section can filter.** This is owner-side schema work that has to happen during B1 — flag it in the spec.
- **Instant quote (B2) needs the B1 service pages as the entry point.** Quote tool lives behind a "Get a quote" CTA on each service detail page — don't try to also build the service page during B2.
- **Shop (B3) is independent** of B1 and B2 except for the routed "Coming Soon" placeholder shipped in B1.
- **FAQ enhances both service pages and contact-form efficiency.** Even a 5-question FAQ per service deflects pre-quote noise.
- **Customer project showcase is a refresh, not a build.** The `collaboration` schema already exists and is rendered on home — B1 should surface it more prominently rather than build new content infrastructure.

## MVP Definition

### Launch With (B1 — Spruce + 3D printing launch)

The minimum to feel like a real, modern, locally-friendly maker-studio site:

- [x] `/3d-printing` service surface (grid + slug detail pages, mirrors `/styles`) — *table stake for the new offering*
- [x] In-page materials section on each service page (filter by service tag) — *replaces top-level `/materials`*
- [x] Refreshed home hero + nav featuring both services equally — *the visual-confidence unlock*
- [x] `/shop` routed as Coming Soon — *avoids dead link, sets expectation for B3*
- [x] Contact form pre-fills service from referrer; honeypot hidden — *low-effort trust + conversion*
- [x] Modal + force-dark fixes (PROJECT.md anti-pattern cleanup) — *quality bar required for the relaunch story*
- [ ] FAQ section per service (5–8 questions) — **strongly recommended add for B1**; only defer if 3D-printing-page work blows out
- [ ] "What we won't make" copy on service pages — *takes 30 minutes, sets professional tone*
- [ ] Turnaround / pickup / service-area copy block — *table stake; one Sanity field*
- [ ] Visible "Reply within X" promise on contact page — *covers the gap until B2's instant quote*

Items marked `[x]` are already in PROJECT.md Active. Items marked `[ ]` are recommended additions to B1 from this research.

### Add After Validation (B2 — Auto-pricing quote)

- [ ] Instant-quote calculator (file upload → material/options → ballpark price) — *the conversion-rate unlock*
- [ ] File-format guidance + design-for-printing tips alongside the calculator — *reduces failed quotes*
- [ ] Sanity `pricing-rule` schema (per-material rates, setup fees, machine-time multipliers) — *data substrate for the calculator*
- [ ] Owner-side admin flow: submitted quotes flow into an inbox for manual confirmation/booking — *PROJECT.md requires manual confirmation before fabrication*
- [ ] (Stretch within B2) File-validation feedback for 3D prints (wall thickness, watertightness) — *premium feel, defer if quote-only ships first*
- [ ] (Stretch within B2) Customer testimonials section, once owner has accumulated B1-era reviews to publish

### Future Consideration (B3 — Shop)

- [ ] Pre-made-goods catalog (laser-cut + 3D-printed inventory) — *Etsy-style sales channel*
- [ ] Checkout + payments via chosen platform (Shopify / Stripe / Snipcart — TBD per PROJECT.md)
- [ ] Order-fulfillment notifications to the studio owner

### Explicitly Deferred / Not in Any Bundle

- [ ] Customer accounts / login — *PROJECT.md out-of-scope; B3 can use guest checkout*
- [ ] Customizable / personalized shop products — *PROJECT.md out-of-scope at B3 launch*
- [ ] Blog / article content — *PROJECT.md out-of-scope*
- [ ] Live chat widget — *anti-feature for one-person studio*
- [ ] Newsletter popup — *anti-feature*

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Bundle | Priority |
|---------|------------|---------------------|--------|----------|
| `/3d-printing` service pages (mirror /styles) | HIGH | LOW–MED | B1 | P1 |
| Home hero + nav refresh | HIGH | MED | B1 | P1 |
| Materials as in-page section per service | MED | LOW | B1 | P1 |
| `/shop` routed as Coming Soon | MED (avoids dead link) | LOW | B1 | P1 |
| Modal + force-dark fixes | MED (correctness) | LOW | B1 | P1 |
| Pre-fill contact form by referrer | MED | LOW | B1 | P1 |
| Hidden honeypot fix | LOW (correctness) | LOW | B1 | P1 |
| Turnaround / pickup / service-area copy | HIGH | LOW | B1 | P1 |
| FAQ per service | HIGH | LOW | B1 | P2 (target P1) |
| "What we won't make" policy | MED | LOW | B1 | P2 |
| "Reply within X" guarantee | MED | LOW | B1 | P2 |
| Customer project showcase (extend collaboration) | HIGH | LOW–MED | B1 | P2 |
| Hero/site copy via Sanity (currently hardcoded) | MED | LOW | B1 | P2 |
| Instant-quote calculator | HIGH | HIGH | B2 | P1 of B2 |
| File-validation feedback | HIGH | HIGH | B2 | P2 of B2 (stretch) |
| Customer testimonials | MED | LOW | B2 | P2 of B2 |
| Design-for-printing tips | MED | LOW | B1/B2 | P3 |
| Pre-made shop catalog + checkout | HIGH | HIGH | B3 | P1 of B3 |

**Priority key (within bundle):**
- P1: Must ship in this bundle
- P2: Strongly recommended; ship if feasible
- P3: Nice to have; defer freely

## Competitor Feature Analysis

| Feature | Big Marketplaces (SendCutSend, Xometry, Ponoko, Shapeways, Sculpteo) | Small Studios (Champion 3D, 3DTomorrow, Sonoma Laser Engraving, Makelab, etc.) | Shapesmith Approach |
|---------|---------|---------|---------|
| Instant-quote calculator | Required, central to UX | Often present but simpler; some still use contact-form quote requests | Defer to B2; B1 uses contact form with pre-fill |
| Account creation | Optional but pushed (instant pricing without account is a SendCutSend differentiator) | Mostly optional | No accounts at all (PROJECT.md) |
| Photo gallery / portfolio | Generic / sparse | Often a hero strength | Lean into it — local makers win on photo specificity |
| Materials catalog | Long detailed lists with specs | Curated short list + photos | Service-scoped in-page section, photo-led |
| FAQ | Extensive (handles edge cases) | Usually present, smaller | 5–8 questions per service in B1 |
| Pickup option | Rare (national shipping focus) | Common, often a selling point | Yes — call out in B1 copy as a local advantage |
| File validation | Sophisticated (chord-deviation checks, manifold checks) | Often human-eyeballed | B2 stretch; if it ships, frame friendly ("walls look thin") not technical |
| "What we won't make" policy | Buried in T&Cs | Sometimes called out in About / FAQ | Yes — surface explicitly, low effort high signal |
| Live chat | Often present | Rare | No (anti-feature for one-person studio) |
| Newsletter popup | Common | Often absent | No (anti-feature) |
| Pre-made shop alongside services | Rare | Common (especially Etsy crossover makers) | Yes, in B3 |
| Customer testimonials | Reviews aggregated from third parties | Hand-curated quotes / case studies | Hand-curated, B1 if owner has material else B2 |
| "Design tips" / educational content | Extensive design guides | Variable | Light, friendly, B1 late or B2 |

**Strategic insight:** Shapesmith should explicitly **not** try to be a small Xometry. The big marketplaces compete on instant-everything and breadth of materials. A one-person local studio competes on **photo-specific portfolio, pickup convenience, friendly tone, and an actual human who replies.** B1's job is to look like that studio. B2 adds an instant-quote tool *because* hobbyists love it, but framed as "fast & friendly," not "industrial procurement."

## Sources

### Primary Competitor Sites Reviewed
- [SendCutSend — Custom Sheet Metal Fabrication](https://sendcutsend.com/) — instant-pricing flagship; account-optional
- [SendCutSend — Pricing & FAQ](https://sendcutsend.com/pricing/)
- [Ponoko — Online metal & plastic laser cutting](https://www.ponoko.com/)
- [Xometry — Custom Online 3D Printing Services](https://www.xometry.com/capabilities/3d-printing-service/)
- [Shapeways — Industrial-Scale On-Demand 3D Printing](https://www.shapeways.com/)
- [Sculpteo — Online 3D Printing Service](https://www.sculpteo.com/en/)
- [Fabworks — Metal Laser Cutting Services](https://www.fabworks.com/services/laser-cutting)
- [OSH Cut — Laser Cutting and Sheet Metal Services](https://www.oshcut.com/)
- [Champion 3D — On-Demand 3D Printing (London studio with pickup)](https://champion3d.com/3d-printing/) — small-studio comparable with pickup flow
- [3DTomorrow — Bespoke 3D Print Service](https://3dtomorrow.com/3d-print-service/) — small-studio comparable with FAQ-driven UX
- [Makelab — On-Demand 3D Printing Brooklyn](https://www.makelab.com/) — small-studio comparable
- [Sonoma Laser Engraving](https://sonomalaserengraving.com/) — local small-shop laser site
- [Custom Laser Engraving (Florida)](https://www.customlaserengraving.io/) — local small-shop laser site
- [Craftcloud — Streamlined 3D Printing](https://craftcloud3d.com/)
- [JLC3DP — Online 3D Printing](https://jlc3dp.com)
- [PCBWay — 3D Printing Service](https://www.pcbway.com/rapid-prototyping/3d-printing/)

### Industry Reference / Best-Practice Sources
- [3D Printing Service Tips — Treatstock](https://www.treatstock.com/help/article/121-helpful-tips-to-be-the-best-3d-printing-service-and-have-more-orders) — small-shop UX guidance
- [How to Attract Clients To Your 3D Printing Business — Zmorph (Medium)](https://medium.com/@ZMorph/how-to-attract-clients-to-your-3d-printing-business-863b81b9e535)
- [Reliable US 3D Printing Services — Royal Fortune 3D](https://www.royalfortune3d.com/post/reliable-us-3d-printing-services-your-guide-to-quality-and-efficiency-1)
- [Best 3D Printing Services — All3DP Pro](https://all3dp.com/1/best-online-3d-printing-service-3d-print-services/)
- [SendCutSend File Formats FAQ](https://sendcutsend.com/faq/what-file-formats-do-you-accept/)
- [STL File Best Practices — BigRep](https://bigrep.com/posts/stl-file-best-practices/)
- [Design Guidelines for FDM 3D Printing — 3D On Demand](https://www.3d-demand.com/blog/design-guidelines-for-fdm-3d-printing-wall-thickness-tolerances-file-prep)
- [Design Guidelines — Weerg](https://www.weerg.com/faq/design-guidelines-for-3d-printing) — file-validation UX reference
- [DigiFabster — Laser Cutting Quoting Software](https://digifabster.com/industry/laser-cutting/) — quote-tool implementation reference for B2

### Conversion / UX Research
- [Lead Generation Forms 2026 — Monday.com](https://monday.com/blog/crm-and-sales/lead-generation-forms/)
- [14 Lead Capture Best Practices 2026 — LeadsHook](https://www.leadshook.com/blog/lead-capture-forms-best-practices/)
- [Lead Capture Examples 2026 — Wisepops](https://wisepops.com/blog/lead-capture)
- [HubSpot — 5 Critical Components of Lead Capture Forms](https://blog.hubspot.com/blog/tabid/6307/bid/28472/the-5-critical-components-of-fantastic-lead-capture-forms.aspx)
- [Newsletter Pop-ups, Enough is Enough — Luca Benazzi (Medium)](https://medium.com/@lucabenazzi/i-am-tired-of-seeing-pop-ups-in-front-of-me-ac02509cb6ed) — anti-pattern source
- [Friction-Free Website Popups — IMPACT](https://www.impactplus.com/blog/6-friction-free-website-popups-you-wish-you-had)
- [Designing Website Flow for Conversions — CXL](https://cxl.com/blog/website-flow-conversions/)

### Confidence Notes
- HIGH confidence: table-stakes set, anti-features, MVP B1 scope — converges across multiple competitor sites and explicit lead-form research.
- MEDIUM confidence: the exact composition of B2's instant-quote tool — small-shop implementations vary widely; depends on file-parsing strategy chosen at B2 discovery time.
- MEDIUM confidence: B3 platform-specific feature shape (Shopify vs Stripe vs Snipcart) — explicitly deferred per PROJECT.md.
- LOW confidence: precise turnaround-time numbers and pickup-location specifics — these are owner-driven copy decisions, not researchable competitively.

---
*Feature research for: local maker-studio service site (laser cutting + 3D printing), Shapesmith Studio relaunch milestone*
*Researched: 2026-05-02*
