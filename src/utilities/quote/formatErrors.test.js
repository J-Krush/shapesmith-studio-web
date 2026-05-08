import { formatError } from './formatErrors';

test('TOO_LARGE includes the size in MB', () => {
	const msg = formatError({ code: 'TOO_LARGE', sizeMB: '30.0' });
	expect(msg).toContain('30.0MB');
});

test('WRONG_FORMAT_3D mentions STL or OBJ', () => {
	const msg = formatError({ code: 'WRONG_FORMAT_3D', ext: 'gltf' });
	expect(msg).toContain('gltf');
	expect(msg).toContain('STL');
	expect(msg).toContain('OBJ');
});

test('WRONG_FORMAT_LASER mentions SVG', () => {
	const msg = formatError({ code: 'WRONG_FORMAT_LASER', ext: 'dxf' });
	expect(msg).toContain('dxf');
	expect(msg).toContain('SVG');
});

test('MALFORMED_STL has CAD-friendly copy', () => {
	const msg = formatError({ code: 'MALFORMED_STL' });
	expect(msg).toMatch(/STL/);
	expect(msg).toMatch(/re-export/i);
});

test('Unknown code falls back to generic', () => {
	const msg = formatError({ code: 'UNKNOWN' });
	expect(msg).toContain('went sideways');
});
