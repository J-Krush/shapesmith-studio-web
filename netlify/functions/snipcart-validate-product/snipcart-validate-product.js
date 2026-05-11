// netlify/functions/snipcart-validate-product/snipcart-validate-product.js
//
// Snipcart JSON crawler endpoint. Called by Snipcart's order-validation server
// BEFORE confirming any order. Snipcart compares the response JSON against the
// data-item-* attributes that came from the cart; if they don't match, the order
// is rejected. This is the SPA-safe alternative to the HTML crawler — without
// it, Snipcart's HTML crawler would hit /shop/{slug} and get back the SPA's
// index.html with no embedded product data, silently failing validation.
//
// Plan 05-06 Task 1 (GREEN). CommonJS — Netlify Functions default runtime.
//
// Flow:
//   1. GET-only (POST/PUT/etc → 405).
//   2. Validate slug shape: regex `^[a-z0-9-]+$/i` + length cap 200 (GROQ injection
//      mitigation; see RESEARCH §Security Domain row "Malicious slug query param").
//   3. Build a parameterized GROQ query against Sanity's anonymous CDN. The slug
//      binds to `$slug` via the URL parameter — no string concatenation into the
//      query body.
//   4. AbortController + 5s timeout on the Sanity fetch (Pitfall 4 — fail-fast).
//   5. Map result to Snipcart JSON-crawler shape (id, name, price, url, description,
//      image?, stock).
//   6. Set Content-Type: application/json so Snipcart routes to the JSON validator
//      (NOT the HTML crawler).
//
// Required JSON fields per docs.snipcart.com/v3/setup/order-validation:
//   id    — must equal data-item-id from the buy button
//   price — must equal data-item-price (Number, decimal '.')
//   url   — must equal data-item-url
// Recommended for parity / defensive guards:
//   name, description, image, stock
//
// Status code map:
//   200 — product found, JSON body returned
//   400 — missing/malformed slug, or non-GET method (405) — see below
//   404 — slug not found / unpublished mid-cart-session
//   405 — non-GET HTTP method
//   502 — Sanity unreachable / non-2xx response (fail-loud during owner-prep)
//
// This Function does NOT require auth — it's intentionally public-readable;
// Sanity's anonymous CDN access is the read-side trust model. The data exposed
// here is the same data the front-end already shows on /shop and /shop/:slug.
//
// Source: RESEARCH §"Pattern 4: JSON Crawler Validation Endpoint (Required for SPA)";
// PRODUCT-SCHEMA-SPEC §5 (single-product GROQ projection).

const SANITY_PROJECT = 'qx9kep1e';
const SANITY_DATASET = 'production';
const API_VERSION = '2023-06-16';

const SLUG_REGEX = /^[a-z0-9-]+$/i;
const SLUG_MAX_LEN = 200;
const FETCH_TIMEOUT_MS = 5000; // Pitfall 4 — Netlify sync function ceiling is 10s.

// CORS — Snipcart's checkout iframe (app.snipcart.com) makes browser-side XHRs
// against this endpoint during payment, in addition to the server-side crawl.
// Endpoint exposes the same public product data the catalog already serves, so
// '*' is acceptable; tighten to 'https://app.snipcart.com' if Snipcart ever
// documents a single canonical origin.
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

// AbortController + setTimeout because Node 20's native fetch does not honor
// a per-call timeout option. Mirrors the Phase 3 submit-quote helper.
const fetchWithTimeout = async (url, options = {}) => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
};

exports.handler = async (event) => {
	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 204, headers: CORS_HEADERS, body: '' };
	}
	if (event.httpMethod !== 'GET') {
		return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };
	}

	const slug = event.queryStringParameters?.slug;
	if (!slug || slug.length > SLUG_MAX_LEN || !SLUG_REGEX.test(slug)) {
		return { statusCode: 400, headers: CORS_HEADERS, body: 'Missing or invalid slug' };
	}

	// Build a parameterized GROQ query. The query string is fixed; the slug binds
	// to the $slug parameter via the URL — no string concatenation into the GROQ
	// body, so even if the slug regex were ever loosened, GROQ injection stays
	// closed. JSON.stringify produces a properly-quoted JSON string literal,
	// which is the form Sanity's HTTP API expects for $-prefixed params.
	const groq = encodeURIComponent(
		`*[_type=="product" && slug.current==$slug][0]{
			"id": slug.current,
			name,
			price,
			description,
			stockQuantity,
			weight,
			"image": images[0].asset.asset->url
		}`
	);
	const slugParam = encodeURIComponent(JSON.stringify(slug));
	const sanityUrl =
		`https://${SANITY_PROJECT}.apicdn.sanity.io/v${API_VERSION}/data/query/${SANITY_DATASET}` +
		`?query=${groq}&%24slug=${slugParam}`;

	let result;
	try {
		const res = await fetchWithTimeout(sanityUrl);
		if (!res.ok) {
			// Log status code only — never the response body, never the slug.
			// (T-05-06-05 information-disclosure mitigation.)
			console.error('Sanity fetch non-OK:', res.status);
			return { statusCode: 502, headers: CORS_HEADERS, body: 'Sanity fetch failed' };
		}
		const json = await res.json();
		result = json.result;
	} catch (e) {
		// AbortError, network error, JSON parse error all funnel here.
		console.error('Sanity fetch error:', e?.name || 'unknown');
		return { statusCode: 502, headers: CORS_HEADERS, body: 'Sanity unreachable' };
	}

	if (!result) {
		// Product was unpublished after the customer added it to cart — refuse the order.
		return { statusCode: 404, headers: CORS_HEADERS, body: 'Product not found' };
	}

	// Reconstruct the URL the buy button sent. Snipcart compares its request URL
	// to this `url` field and rejects the order if they differ. We must echo
	// back exactly what AddToCartButton (Plan 05-05) emits.
	// Prefer Netlify's `URL` env var (per-deploy primary URL); fall back to the
	// request host (covers preview deploys that hit a non-primary domain); final
	// fallback is the production domain.
	const baseUrl =
		process.env.URL ||
		(event.headers?.host ? `https://${event.headers.host}` : 'https://shapesmith.studio');
	const productUrl = `${baseUrl}/.netlify/functions/snipcart-validate-product?slug=${slug}`;

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
	};
	if (result.image) {
		responseBody.image = result.image;
	}

	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
		body: JSON.stringify(responseBody),
	};
};
