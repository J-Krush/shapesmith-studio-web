// netlify/functions/snipcart-order-webhook/snipcart-order-webhook.js
//
// Snipcart order.completed webhook handler (CONTEXT D-15 — custom Resend email
// half of the dual-email strategy; Snipcart's default email handles the safety
// net). Triggered by Snipcart's webhook delivery whenever an order completes;
// validated via Snipcart's request-token callback (RESEARCH key-finding 4 +
// Pattern 5 — there is no HMAC, no shared secret).
//
// Plan 05-07 Task 2 (GREEN). CommonJS — Netlify Functions default runtime.
//
// Flow:
//   1. POST-only (other methods → 405).
//   2. 50KB raw-body ceiling (smaller than submit-quote because order payloads
//      carry no file uploads). Larger than that, the Function won't even parse.
//   3. Token validation: GET https://app.snipcart.com/api/requestvalidation/{token}
//      with 5s AbortController timeout. Fail-closed:
//        - missing/empty header → 401
//        - non-2xx response from Snipcart → 401
//        - timeout / network error → 502 (Snipcart retries non-2xx for ~24h, so
//          a transient outage replays once recovered).
//   4. eventName filter: only `order.completed` proceeds to email send. Other
//      events get an idempotent 200 (defensive against dashboard misconfig).
//   5. Resend email send with 5s Promise.race timeout (Phase 3 precedent).
//      On failure: log invoice + return 200 (NOT 502). Returning non-2xx would
//      trigger Snipcart's retry storm; the order is still in Snipcart's
//      dashboard and the owner gets Snipcart's default email anyway. Single
//      missed custom email is acceptable per PATTERNS.md deviation 9 +
//      threat T-05-07-06.
//   6. 200 `{ ok: true }` on success.
//
// Env vars (server-only):
//   - RESEND_API_KEY  — Existing Phase 3 env var, reused. Verified present in
//                       Plan 08 owner-prep before deploy.
//   - SNIPCART_SECRET_API_KEY  — Secret API key from Snipcart Dashboard
//                                (Account → API Keys). Used as HTTP Basic-auth
//                                username (empty password) when calling
//                                Snipcart's request-validation endpoint.
//                                Snipcart support thread #169 confirms this
//                                endpoint requires Basic auth (the public
//                                Snipcart docs incorrectly imply it's open).
//   - URL             — Netlify-injected per-deploy primary URL (read indirectly
//                       via the dashboard link; not used here directly).
//
// Source: RESEARCH §"Pattern 5: Webhook Signature Validation" — full handler
// shape; PATTERNS.md "Cross-Cutting Deviations" item 9 (200-on-Resend-fail);
// CONTEXT D-15 (dual-email strategy).

const { Resend } = require('resend');
const formatOrderEmail = require('./formatOrderEmail');

const resend = new Resend(process.env.RESEND_API_KEY);
const FETCH_TIMEOUT_MS = 5000; // Pitfall 3 — Netlify sync function ceiling is 10s.
const MAX_BODY_BYTES = 50 * 1024; // 50KB ceiling for an order payload.

// AbortController + setTimeout — Node 20's native fetch does not honor a
// per-call timeout option. Mirrors the Phase 3 / snipcart-validate-product helper.
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
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method not allowed' };
	}

	// Body-size ceiling (T-05-07-04 mitigation). Reject before parse.
	if (event.body && event.body.length > MAX_BODY_BYTES) {
		return { statusCode: 400, body: 'Payload too large' };
	}

	// 1. Validate Snipcart request token. Netlify normalizes header names to
	// lowercase, but we accept both casings defensively in case the runtime
	// ever changes (Netlify history has had quirks here).
	const token =
		event.headers?.['x-snipcart-requesttoken'] ||
		event.headers?.['X-Snipcart-RequestToken'];
	if (!token) {
		return { statusCode: 401, body: 'Missing webhook token' };
	}

	// Snipcart's request-validation endpoint requires HTTP Basic auth — the
	// secret API key is the username, password is empty. Confirmed via Snipcart
	// support thread #169 (https://support.snipcart.com/t/webhook-request-validation-fails/169).
	// Without this, the endpoint returns 401, which our handler would interpret
	// as a forged token and reject every legitimate webhook delivery.
	//
	// Fail-loud on missing config: return 502 with a body distinct from the
	// forged-token 401 ('Invalid webhook token') so the owner can grep Netlify
	// logs and distinguish missing-config from forged-payload.
	const snipcartSecretKey = process.env.SNIPCART_SECRET_API_KEY;
	if (!snipcartSecretKey) {
		console.error('SNIPCART_SECRET_API_KEY not configured');
		return { statusCode: 502, body: 'Webhook validation not configured' };
	}
	const basicAuth = Buffer.from(`${snipcartSecretKey}:`).toString('base64');

	try {
		const verifyRes = await fetchWithTimeout(
			`https://app.snipcart.com/api/requestvalidation/${encodeURIComponent(token)}`,
			{ headers: { Authorization: `Basic ${basicAuth}`, Accept: 'application/json' } },
		);
		if (!verifyRes.ok) {
			// Log the status only — never the token (information disclosure
			// T-05-07-05). A 401 here means Snipcart says the token is forged
			// or expired. Return 401 to refuse the request.
			console.error('Snipcart token validation rejected:', verifyRes.status);
			return { statusCode: 401, body: 'Invalid webhook token' };
		}
	} catch (e) {
		// Fail-closed: a forged payload must not slip through during a Snipcart
		// outage. 502 lets Snipcart retry (Snipcart retries non-2xx for ~24h,
		// so a transient outage replays once recovered). RESEARCH Pitfall 3.
		console.error('Snipcart token validation error:', e?.name || 'unknown');
		return { statusCode: 502, body: 'Webhook validation unavailable' };
	}

	// 2. Parse + filter event types.
	let payload;
	try {
		payload = JSON.parse(event.body);
	} catch {
		return { statusCode: 400, body: 'Invalid JSON' };
	}
	if (payload.eventName !== 'order.completed') {
		// Acknowledge other event types with 200 — the dashboard subscription
		// should restrict to order.completed only, but if a misconfigured
		// dashboard ever sends e.g. order.status.changed, we don't want to
		// email the owner for every state transition. This is defensive only.
		return { statusCode: 200, body: 'OK (ignored event)' };
	}

	// 3. Send custom-formatted owner email via Resend.
	//
	// Two-path error handling — Resend SDK v6 (`resend ^6.12.3`) does NOT throw on
	// API failure. `resend.emails.send(...)` resolves with `{ data, error }`:
	//   - Success:     { data: { id }, error: null }
	//   - API failure: { data: null,   error: { name, message } }  ← caught below
	//                  by inspecting `result?.error` AFTER the await.
	//   - Thrown:      Promise.race timeout, missing SDK module, network reset, etc.
	//                  ← caught by the existing try/catch as before.
	//
	// Both paths return 200 — PATTERNS.md deviation 9: returning non-2xx would
	// trigger Snipcart's retry storm. We log explicitly so the owner can grep
	// Netlify Function logs and tell the three outcomes apart.
	try {
		const result = await Promise.race([
			resend.emails.send({
				// Verified sender domain (Phase 3 owner-prep). Envelope-from is
				// hardcoded so visitor input never enters the From header.
				from: 'Shapesmith Studio <orders@shapesmith.studio>',
				to: ['jkrush@shapesmith.studio'],
				// Reply-to lets the owner respond to the buyer with one click.
				// Optional-chained because we do not trust payload shape blindly.
				reply_to: payload.content?.email ?? 'noreply@shapesmith.studio',
				subject: `[Order ${payload.content?.invoiceNumber ?? '???'}] ${payload.content?.itemsCount ?? '?'} item(s) — $${payload.content?.finalGrandTotal ?? '?'}`,
				text: formatOrderEmail(payload.content),
			}),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Resend timeout')), FETCH_TIMEOUT_MS),
			),
		]);

		// Resend SDK v6 resolved-error path: the await did NOT throw, but the API
		// returned an error object (invalid API key, unverified sender domain,
		// recipient rejected, rate limit, etc.). The current contract is to log +
		// return 200 — same shape as the thrown-exception path below — so Snipcart
		// does not retry.
		if (result?.error) {
			console.error(
				'Resend API returned error:',
				result.error?.message || result.error?.name || 'unknown',
			);
			console.error(
				'Order received but custom email failed — see Snipcart dashboard:',
				payload.content?.invoiceNumber ?? 'unknown',
			);
			return { statusCode: 200, body: 'OK (email send failed; logged)' };
		}

		// Success-path traceability: log the message id + invoice so the owner can
		// correlate a delivered Resend email with the corresponding Snipcart order.
		console.log(
			'Resend send accepted, message id:',
			result?.data?.id ?? 'unknown',
			'invoice:',
			payload.content?.invoiceNumber ?? 'unknown',
		);
	} catch (e) {
		// Critical deviation from submit-quote.js: this Function returns 200 even
		// when Resend fails. Snipcart retries on non-2xx responses, which would
		// cascade into an email-storm if Resend is intermittently flaky. The
		// order is still in Snipcart's dashboard, and the owner gets Snipcart's
		// default email (CONTEXT D-15 keeps both). Single missed custom email
		// is acceptable vs. retry-storm risk. PATTERNS.md "Cross-Cutting
		// Deviations" item 9 + threat T-05-07-06 document this trade-off.
		//
		// Log only the invoice number (no PII — T-05-07-05) so the owner can
		// look up the order in Snipcart's dashboard if the custom email never
		// arrives.
		console.error('Resend send failed (non-fatal):', e?.message || 'unknown');
		console.error(
			'Order received but custom email failed — see Snipcart dashboard:',
			payload.content?.invoiceNumber ?? 'unknown',
		);
		return { statusCode: 200, body: 'OK (email send failed; logged)' };
	}

	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ok: true }),
	};
};
