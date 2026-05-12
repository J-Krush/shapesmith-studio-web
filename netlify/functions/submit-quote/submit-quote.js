// Netlify Function — visitor → owner-email handoff for the auto-pricing quote tool.
//
// Plan 03-03 Task 2 (GREEN). CommonJS — Netlify Functions default runtime.
//
// Flow:
//   1. POST-only, JSON body, ≤100KB raw body (QTE-09 server-side memory bound).
//   2. Required fields present: name / email / service / recaptchaToken / metadata.
//   3. Cheap email-shape regex check.
//   4. Header-injection guard — strip CR/LF from `name` before it lands in subject.
//   5. reCAPTCHA v3 server verify (5s timeout) — score >= 0.5 required (Pitfall 9 default).
//   6. Resend email send (5s timeout) from a verified sender domain. Reply-to = visitor.
//   7. 200 `{ ok: true }` on success.
//
// Env vars (server-only):
//   - RESEND_API_KEY        — Resend dashboard API key, after sender domain verified.
//   - RECAPTCHA_SECRET_KEY  — Google reCAPTCHA admin secret (NEVER browser-exposed).
//
// The site key (REACT_APP_RECAPTCHA_SITE_KEY) is browser-side only — it is NOT read here.

const { Resend } = require('resend');
const formatQuoteText = require('./formatQuoteText');

const resend = new Resend(process.env.RESEND_API_KEY);
const RECAPTCHA_THRESHOLD = 0.5; // Pitfall 9 default; tunable post-launch.
const MAX_BODY_BYTES = 100 * 1024; // 100KB — server-side memory bound (QTE-09).
const FETCH_TIMEOUT_MS = 5000; // Pitfall 10 — Netlify sync function ceiling is 10s.

// AbortController + setTimeout because Node 18+'s fetch does not natively
// honor a per-call timeout option.
const fetchWithTimeout = async (url, options) => {
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

	// Server-side memory bound (QTE-09) — reject oversized payloads BEFORE parsing.
	if (event.body && event.body.length > MAX_BODY_BYTES) {
		return { statusCode: 400, body: 'Payload too large' };
	}

	let payload;
	try {
		payload = JSON.parse(event.body);
	} catch {
		return { statusCode: 400, body: 'Invalid JSON' };
	}

	const required = ['name', 'email', 'service', 'recaptchaToken', 'metadata'];
	for (const k of required) {
		if (!payload[k]) return { statusCode: 400, body: `Missing ${k}` };
	}

	// Cheap email-shape check — keeps obviously bogus payloads off Resend.
	// The regex also rejects whitespace (incl. \r\n), which catches naive header-
	// injection attempts in the email field (T-03-03-10).
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
		return { statusCode: 400, body: 'Invalid email' };
	}

	// T-03-03-10 — header-injection guard. The visitor-supplied `name` lands in
	// the `subject` line; `\r\n` could otherwise be folded into a forged Bcc header.
	// Resend builds RFC5322 headers from the typed `from`/`to` props, so this is
	// belt-and-suspenders, but cheap.
	const safeName = String(payload.name).replace(/[\r\n]/g, ' ');

	// reCAPTCHA v3 server verify.
	let verifyJson;
	try {
		const verifyRes = await fetchWithTimeout(
			'https://www.google.com/recaptcha/api/siteverify',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					secret: process.env.RECAPTCHA_SECRET_KEY,
					response: payload.recaptchaToken,
				}),
			},
		);
		verifyJson = await verifyRes.json();
	} catch (e) {
		console.error('reCAPTCHA verify failed:', e);
		return { statusCode: 502, body: 'Spam check unavailable' };
	}
	if (!verifyJson.success || (verifyJson.score ?? 0) < RECAPTCHA_THRESHOLD) {
		return { statusCode: 403, body: 'Spam check failed' };
	}

	// Send via Resend (with timeout).
	try {
		await Promise.race([
			resend.emails.send({
				// Verified sender domain required (Pitfall 8 + owner-prep checkpoint).
				// Envelope-from is hardcoded — visitor input only enters reply_to.
				from: 'Shapesmith Studio <quotes@shapesmith.studio>',
				to: ['jkrush@shapesmith.studio'],
				reply_to: payload.email,
				subject: `[Quote] ${payload.service} — ${safeName}`,
				text: formatQuoteText({ ...payload, name: safeName }),
			}),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Resend timeout')), FETCH_TIMEOUT_MS),
			),
		]);
	} catch (e) {
		console.error('Resend send failed:', e);
		return { statusCode: 502, body: 'Email send failed' };
	}

	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ok: true }),
	};
};
