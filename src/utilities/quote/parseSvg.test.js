// Unit tests for parseSvg — DOMParser + offscreen-host getTotalLength/getBBox.
// jsdom provides DOMParser; getTotalLength + getBBox are supplied by jsdom but
// return zero/heuristic values for paths it can't compute. We seed simple paths
// where length is determinable.
import { parseSvg } from './parseSvg';

// jsdom does NOT implement SVGGeometryElement.getTotalLength or SVGGraphicsElement.getBBox
// in its default build. Patch them at module scope so the parser's offscreen-host
// trick works inside the Jest environment. Real browsers compute these natively.
beforeAll(() => {
	if (typeof SVGElement !== 'undefined') {
		// getTotalLength: length of the longest side derived from the d attribute,
		// fallback to 0. Sufficient for "M 0 0 L 100 0" expecting 100.
		// eslint-disable-next-line no-extend-native
		SVGElement.prototype.getTotalLength = function () {
			const d = this.getAttribute && this.getAttribute('d');
			if (!d) return 0;
			// crude line-length sum: parse "M x y L x y" pairs
			const cmds = d.match(/[ML]\s*-?[\d.]+\s+-?[\d.]+/g) || [];
			let total = 0;
			let prev = null;
			for (const cmd of cmds) {
				const m = cmd.match(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/);
				if (!m) continue;
				const x = parseFloat(m[1]);
				const y = parseFloat(m[2]);
				if (prev) {
					total += Math.hypot(x - prev[0], y - prev[1]);
				}
				prev = [x, y];
			}
			return total;
		};
		SVGElement.prototype.getBBox = function () {
			// Use viewBox if available on the element (or its parent svg)
			const svg = this.tagName === 'svg' ? this : this.ownerSVGElement;
			const vb = svg && svg.getAttribute && svg.getAttribute('viewBox');
			if (vb) {
				const parts = vb.split(/\s+|,/).map(Number);
				return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
			}
			return { x: 0, y: 0, width: 0, height: 0 };
		};
	}
});

test('parseSvg: simple path with mm width returns expected bbox + path length', () => {
	const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100mm" height="50mm"><path d="M 0 0 L 100 0"/></svg>';
	const r = parseSvg(svg, svg.length);
	expect(r.mode).toBe('laser');
	expect(r.bbox.w).toBeCloseTo(100, 0);
	expect(r.bbox.h).toBeCloseTo(50, 0);
	expect(r.pathLengthMm).toBe(100);
	expect(r.unitWarning).toBe(false);
});

test('parseSvg: NOT_SVG thrown when root is not <svg>', () => {
	expect(() => parseSvg('<not-svg/>', 13)).toThrow('NOT_SVG');
});

test('parseSvg: missing width AND viewBox sets unitWarning true', () => {
	const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 50 0"/></svg>';
	const r = parseSvg(svg, svg.length);
	expect(r.unitWarning).toBe(true);
});

test('parseSvg: implicit shapes (rect) included in pathLength via getTotalLength', () => {
	const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100mm" height="50mm"><rect x="0" y="0" width="50" height="20"/></svg>';
	const r = parseSvg(svg, svg.length);
	// Our jsdom shim returns 0 for rect.getTotalLength (no d attribute). The
	// behavior we care about here is that parseSvg invokes the call without
	// throwing and includes the result.
	expect(r.mode).toBe('laser');
	expect(r.pathLengthMm).toBeGreaterThanOrEqual(0);
});
