// SVG parser — DOMParser into an isolated document, then clone into an
// offscreen-host `<div>` so getTotalLength + getBBox can compute against the
// live DOM. NEVER append the user SVG to a visible container — Pitfall 5
// (D-22 + RESEARCH.md). The host is removed in `finally` so an exception
// during parse cannot leak the host.
//
// Output contract (consumed by GeometrySummary.jsx):
//   { mode: 'laser', bbox: { w, h }, pathLengthMm, unitWarning, fileSizeMB }
//
// Errors:
//   throw new Error('NOT_SVG') — root element isn't <svg> or DOMParser reported parsererror.
//   throw new Error('PARSE_FAILED') — DOM operations failed (e.g. getBBox threw).

const PX_PER_MM = 96 / 25.4; // SVG default DPI per CSS spec (Pitfall 4).

const parseUnit = (val) => {
	if (!val) return null;
	const m = String(val).trim().match(/^([\d.]+)\s*(mm|cm|in|pt|px|)?$/);
	if (!m) return null;
	const n = parseFloat(m[1]);
	switch (m[2] || '') {
		case 'mm': return n;
		case 'cm': return n * 10;
		case 'in': return n * 25.4;
		case 'pt': return n * 25.4 / 72;
		case 'px':
		case '': return n / PX_PER_MM;
		default: return null;
	}
};

export const parseSvg = (text, fileSizeBytes) => {
	const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
	const svg = doc.documentElement;
	if (!svg || svg.tagName !== 'svg' || doc.querySelector('parsererror')) {
		throw new Error('NOT_SVG');
	}

	const vbAttr = svg.getAttribute('viewBox');
	const vb = vbAttr ? vbAttr.split(/\s+|,/).map(Number) : null;
	const widthMm = parseUnit(svg.getAttribute('width'));

	let scale = 1;
	let unitWarning = false;
	if (vb && widthMm && vb[2] > 0) {
		scale = widthMm / vb[2];
	} else if (!widthMm && !vb) {
		unitWarning = true;
	}

	const host = document.createElement('div');
	host.style.cssText
		= 'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden';
	document.body.appendChild(host);

	let pathLengthMm = 0;
	let bbox = { w: 0, h: 0 };
	try {
		host.appendChild(svg.cloneNode(true));
		const liveSvg = host.querySelector('svg');
		// <path> elements first.
		liveSvg.querySelectorAll('path').forEach((p) => {
			pathLengthMm += p.getTotalLength() * scale;
		});
		// Implicit shapes (D-16 — included per RESEARCH.md Open Question 2):
		// rect/circle/ellipse/line/polyline/polygon all support getTotalLength
		// since SVG 2 (SVGGeometryElement). Browsers without the union still
		// expose it on the individual prototypes.
		liveSvg
			.querySelectorAll('rect, circle, ellipse, line, polyline, polygon')
			.forEach((el) => {
				if (typeof el.getTotalLength === 'function') {
					pathLengthMm += el.getTotalLength() * scale;
				}
			});
		const box = liveSvg.getBBox();
		bbox = {
			w: Number((box.width * scale).toFixed(1)),
			h: Number((box.height * scale).toFixed(1)),
		};
	} catch {
		throw new Error('PARSE_FAILED');
	} finally {
		host.remove();
	}

	return {
		mode: 'laser',
		bbox,
		pathLengthMm: Number(pathLengthMm.toFixed(0)),
		unitWarning,
		fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
	};
};
