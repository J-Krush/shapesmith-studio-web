// Unit tests for the signed-tetrahedra volume + bbox math (extracted from
// parseStl/parseObj so the math runs without Three.js's ESM-only loaders).
// Plan 03-01's canonical fixture: 10x10x10 mm cube → 1 cm³.
import { volumeAndBbox } from './volumeAndBbox';

const buildCubePositions = (reverse = false) => {
	const v = [
		[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
		[0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
	];
	const tris = [
		[0, 2, 1], [0, 3, 2],
		[4, 5, 6], [4, 6, 7],
		[0, 1, 5], [0, 5, 4],
		[2, 3, 7], [2, 7, 6],
		[0, 4, 7], [0, 7, 3],
		[1, 2, 6], [1, 6, 5],
	];
	const arr = new Float32Array(tris.length * 9);
	let off = 0;
	for (const tri of tris) {
		const order = reverse ? [tri[0], tri[2], tri[1]] : tri;
		for (const idx of order) {
			arr[off++] = v[idx][0];
			arr[off++] = v[idx][1];
			arr[off++] = v[idx][2];
		}
	}
	return arr;
};

test('volumeAndBbox: 1cm3 unit cube returns volumeCm3 ~= 1.00', () => {
	const r = volumeAndBbox(buildCubePositions());
	expect(r.triangleCount).toBe(12);
	expect(r.volumeCm3).toBeGreaterThan(0.99);
	expect(r.volumeCm3).toBeLessThan(1.01);
});

test('volumeAndBbox: bbox of unit cube is 10x10x10 mm', () => {
	const r = volumeAndBbox(buildCubePositions());
	expect(r.bbox.w).toBeCloseTo(10, 1);
	expect(r.bbox.d).toBeCloseTo(10, 1);
	expect(r.bbox.h).toBeCloseTo(10, 1);
});

test('volumeAndBbox: in3 secondary equals cm3 / 16.387 (rounded)', () => {
	const r = volumeAndBbox(buildCubePositions());
	expect(r.volumeIn3).toBeGreaterThan(0.05);
	expect(r.volumeIn3).toBeLessThan(0.07);
});

test('volumeAndBbox: reversed winding still yields positive volume (winding-flip safe)', () => {
	const r = volumeAndBbox(buildCubePositions(true));
	expect(r.volumeCm3).toBeGreaterThan(0.99);
	expect(r.volumeCm3).toBeLessThan(1.01);
});
