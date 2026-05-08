// Plain-text email body formatter for the owner-notification email sent when a
// visitor submits a quote. Extracted into its own module so the standalone
// `pnpm test` gate can unit-test the formatting contract (QTE-05 range lock,
// 3D-only / laser-only field gating) without booting the full handler or
// requiring `resend`.
//
// CommonJS — the Netlify Function this is required from is CommonJS too.
//
// Number-format contract (mirrors src/components/quote/PriceRange.jsx formatUsd):
//   n < 1000  → `$<rounded>`     (e.g. $24)
//   n >= 1000 → `$<n/1000.toFixed(1)>k`  (e.g. $1.2k)
// Range separator: U+2013 EN DASH (–), NEVER U+002D HYPHEN.

const formatUsd = (n) => {
	if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
	return `$${Math.round(n)}`;
};

const formatQuoteText = (p) => {
	const m = p.metadata || {};
	// QTE-05 lock — ALWAYS render both sides of the range, even when low === high.
	const range = `${formatUsd(m.priceLow)} – ${formatUsd(m.priceHigh)}`; // U+2013 en-dash

	const lines = [
		`Service: ${p.service}`,
		`From: ${p.name} <${p.email}>`,
		'',
		`File: ${m.filename} (${m.fileSizeMB} MB)`,
	];
	// 3D-only fields — present iff the visitor uploaded an STL/OBJ.
	if (m.volumeCm3 != null) lines.push(`Volume: ${m.volumeCm3} cm³`);
	if (m.bbox) lines.push(`Bounding box: ${m.bbox}`);
	if (m.triangleCount != null) lines.push(`Triangles: ${m.triangleCount}`);
	// Laser-only fields — present iff the visitor uploaded an SVG.
	if (m.cutArea) lines.push(`Cut area: ${m.cutArea}`);
	if (m.pathLengthMm != null) lines.push(`Total cut length: ${m.pathLengthMm} mm`);
	lines.push(`Material: ${m.materialName}`);
	lines.push(`Quantity: ${m.quantity}`);
	lines.push(`Estimated range: ${range}`);
	if (p.message) lines.push('', `Message: ${p.message}`);
	lines.push('', 'Reply to this email with a real quote.');
	return lines.join('\n');
};

module.exports = formatQuoteText;
module.exports.formatUsd = formatUsd;
