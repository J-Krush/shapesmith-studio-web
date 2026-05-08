// Unit tests for parseObj — same volume math as parseStl, OBJLoader replaces
// STLLoader. We synthesize an OBJ unit cube as plain text.
import { parseObj } from './parseObj';

const UNIT_CUBE_OBJ = `
v 0 0 0
v 10 0 0
v 10 10 0
v 0 10 0
v 0 0 10
v 10 0 10
v 10 10 10
v 0 10 10
f 1 3 2
f 1 4 3
f 5 6 7
f 5 7 8
f 1 2 6
f 1 6 5
f 3 4 8
f 3 8 7
f 1 5 8
f 1 8 4
f 2 3 7
f 2 7 6
`;

test('parseObj: 1cm3 unit cube returns volumeCm3 ~= 1.00', () => {
	const r = parseObj(UNIT_CUBE_OBJ, UNIT_CUBE_OBJ.length);
	expect(r.mode).toBe('3d');
	expect(r.triangleCount).toBe(12);
	expect(r.volumeCm3).toBeGreaterThan(0.99);
	expect(r.volumeCm3).toBeLessThan(1.01);
});

test('parseObj: malformed input throws PARSE_FAILED', () => {
	// OBJLoader is permissive and returns an empty group for nonsense; we expect
	// the empty-positions check to throw PARSE_FAILED.
	expect(() => parseObj('not-an-obj-file', 14)).toThrow('PARSE_FAILED');
});
