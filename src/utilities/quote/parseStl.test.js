// Unit tests for parseStl — verify signed-tetrahedra volume math against a
// synthesized 12-triangle binary STL of a 10x10x10 mm cube. The cube is the
// canonical test fixture per Plan 03-01 done criteria — 1cm³ ± 0.01.
//
// Binary STL layout (per https://en.wikipedia.org/wiki/STL_(file_format)):
//   0..79     : 80-byte header (anything)
//   80..83    : uint32 little-endian triangle count
//   84..N     : per triangle (50 bytes): 12-byte normal + 9*4-byte vertices + 2-byte attr
import { parseStl } from './parseStl';

const buildCubeStl = (reverseWinding = false) => {
	// 8 corners of a 10x10x10 mm cube anchored at origin.
	const v = [
		[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
		[0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
	];
	// 12 triangles forming a closed cube. Each face is 2 tris with consistent
	// outward winding (right-hand rule, normal points away from cube interior).
	const tris = [
		// bottom (z=0), normal -z
		[0, 2, 1], [0, 3, 2],
		// top (z=10), normal +z
		[4, 5, 6], [4, 6, 7],
		// front (y=0), normal -y
		[0, 1, 5], [0, 5, 4],
		// back (y=10), normal +y
		[2, 3, 7], [2, 7, 6],
		// left (x=0), normal -x
		[0, 4, 7], [0, 7, 3],
		// right (x=10), normal +x
		[1, 2, 6], [1, 6, 5],
	];

	const triCount = tris.length;
	const buf = new ArrayBuffer(84 + triCount * 50);
	const view = new DataView(buf);
	// 80-byte header is left as zeroes — STLLoader binary detection uses size match.
	view.setUint32(80, triCount, true);
	let off = 84;
	for (const tri of tris) {
		const order = reverseWinding ? [tri[0], tri[2], tri[1]] : tri;
		// normal (12 bytes) — leave zero; loader recomputes from vertices when zero.
		view.setFloat32(off, 0, true); off += 4;
		view.setFloat32(off, 0, true); off += 4;
		view.setFloat32(off, 0, true); off += 4;
		// 3 vertices, each 12 bytes (x, y, z float32 little-endian)
		for (const idx of order) {
			view.setFloat32(off, v[idx][0], true); off += 4;
			view.setFloat32(off, v[idx][1], true); off += 4;
			view.setFloat32(off, v[idx][2], true); off += 4;
		}
		// attribute byte count (2 bytes)
		view.setUint16(off, 0, true); off += 2;
	}
	return buf;
};

test('parseStl: 1cm3 unit cube returns volumeCm3 ~= 1.00', () => {
	const buf = buildCubeStl();
	const r = parseStl(buf, buf.byteLength);
	expect(r.mode).toBe('3d');
	expect(r.triangleCount).toBe(12);
	expect(r.volumeCm3).toBeGreaterThan(0.99);
	expect(r.volumeCm3).toBeLessThan(1.01);
});

test('parseStl: bbox of the unit cube is 10x10x10 mm', () => {
	const buf = buildCubeStl();
	const r = parseStl(buf, buf.byteLength);
	expect(r.bbox.w).toBeCloseTo(10, 1);
	expect(r.bbox.d).toBeCloseTo(10, 1);
	expect(r.bbox.h).toBeCloseTo(10, 1);
});

test('parseStl: in3 secondary equals cm3 / 16.387 (rounded)', () => {
	const buf = buildCubeStl();
	const r = parseStl(buf, buf.byteLength);
	// 1 cm3 ~= 0.061 in3
	expect(r.volumeIn3).toBeGreaterThan(0.05);
	expect(r.volumeIn3).toBeLessThan(0.07);
});

test('parseStl: reversed winding still yields positive volume (winding-flip safe)', () => {
	const buf = buildCubeStl(true);
	const r = parseStl(buf, buf.byteLength);
	expect(r.volumeCm3).toBeGreaterThan(0.99);
	expect(r.volumeCm3).toBeLessThan(1.01);
});

test('parseStl: malformed input throws PARSE_FAILED', () => {
	expect(() => parseStl(new ArrayBuffer(8), 8)).toThrow('PARSE_FAILED');
});

test('parseStl: fileSizeMB rounds to 2 decimals', () => {
	const buf = buildCubeStl();
	const r = parseStl(buf, 1024 * 1024 * 2.5);
	expect(r.fileSizeMB).toBeCloseTo(2.5, 2);
});
