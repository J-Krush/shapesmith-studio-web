// Unit tests for the Netlify Function's formatQuoteText helper.
// The helper lives at netlify/functions/submit-quote/formatQuoteText.js (CommonJS,
// since the function is CommonJS); this test reaches across the rootDir boundary
// via a relative require so Jest picks it up under the standard `pnpm test` gate.
//
// Plan 03-03 Task 2 RED.
//
// QTE-05 lock: range is ALWAYS rendered as `$low – $high` (U+2013 en-dash),
// NEVER as a single point value, even server-side in the owner email.
const formatQuoteText = require('../../../netlify/functions/submit-quote/formatQuoteText');

const BASE_3D_PAYLOAD = {
	name: 'Joel Krush',
	email: 'joel@example.com',
	service: 'print',
	metadata: {
		filename: 'unit-cube.stl',
		fileSizeMB: 0.5,
		materialName: 'PLA — Black',
		quantity: 2,
		priceLow: 24,
		priceHigh: 38,
		volumeCm3: 1.0,
		bbox: '10 × 10 × 10 mm',
		triangleCount: 12,
	},
};

const BASE_LASER_PAYLOAD = {
	name: 'Joel Krush',
	email: 'joel@example.com',
	service: 'laser',
	metadata: {
		filename: 'logo.svg',
		fileSizeMB: 0.05,
		materialName: 'Birch Plywood 3mm',
		quantity: 1,
		priceLow: 49,
		priceHigh: 53,
		cutArea: '200 × 100 mm',
		pathLengthMm: 800,
	},
};

test('formatQuoteText 3D payload renders required fields', () => {
	const text = formatQuoteText(BASE_3D_PAYLOAD);
	expect(text).toContain('Service: print');
	expect(text).toContain('From: Joel Krush <joel@example.com>');
	expect(text).toContain('File: unit-cube.stl (0.5 MB)');
	expect(text).toContain('Volume: 1 cm³');
	expect(text).toContain('Bounding box: 10 × 10 × 10 mm');
	expect(text).toContain('Triangles: 12');
	expect(text).toContain('Material: PLA — Black');
	expect(text).toContain('Quantity: 2');
});

test('formatQuoteText laser payload renders cut area + path length, NOT volume/triangles', () => {
	const text = formatQuoteText(BASE_LASER_PAYLOAD);
	expect(text).toContain('Service: laser');
	expect(text).toContain('Cut area: 200 × 100 mm');
	expect(text).toContain('Total cut length: 800 mm');
	expect(text).not.toContain('Volume:');
	expect(text).not.toContain('Triangles:');
});

test('formatQuoteText renders price range with U+2013 en-dash, NEVER a single number (QTE-05)', () => {
	const text = formatQuoteText(BASE_3D_PAYLOAD);
	// U+2013 EN DASH (–), NOT U+002D HYPHEN (-).
	expect(text).toContain('Estimated range: $24 – $38');
	expect(text).toMatch(/\$\d+(?:\.\d+)?(?:k)? – \$\d+(?:\.\d+)?(?:k)?/);
});

test('formatQuoteText still renders a range when priceLow === priceHigh (QTE-05 lock)', () => {
	const flatPayload = {
		...BASE_3D_PAYLOAD,
		metadata: { ...BASE_3D_PAYLOAD.metadata, priceLow: 30, priceHigh: 30 },
	};
	const text = formatQuoteText(flatPayload);
	// Even when the two are equal we render both sides — never collapse.
	expect(text).toContain('Estimated range: $30 – $30');
});

test('formatQuoteText formats prices >= $1000 with the kilo suffix', () => {
	const bigPayload = {
		...BASE_3D_PAYLOAD,
		metadata: { ...BASE_3D_PAYLOAD.metadata, priceLow: 1200, priceHigh: 1450 },
	};
	const text = formatQuoteText(bigPayload);
	expect(text).toContain('Estimated range: $1.2k – $1.5k');
});

test('formatQuoteText omits the optional message line when message is empty', () => {
	const text = formatQuoteText(BASE_3D_PAYLOAD);
	expect(text).not.toContain('Message:');
});

test('formatQuoteText includes the message line when message is provided', () => {
	const withMessage = { ...BASE_3D_PAYLOAD, message: 'Please prioritize matte finish.' };
	const text = formatQuoteText(withMessage);
	expect(text).toContain('Message: Please prioritize matte finish.');
});

test('formatQuoteText ends with the reply-instruction line', () => {
	const text = formatQuoteText(BASE_3D_PAYLOAD);
	expect(text.trim().endsWith('Reply to this email with a real quote.')).toBe(true);
});
