// STL parser — binary + ASCII via Three.js's STLLoader (subpath import only,
// per RESEARCH.md Anti-Pattern: NEVER `import * as THREE from 'three'`).
// Volume math is extracted into `./volumeAndBbox` so it can be unit-tested
// without Three.js's ESM-only loaders running through Jest 27 (CRA 5).
//
// Output contract (consumed by GeometrySummary.jsx):
//   { mode: '3d', triangleCount, volumeCm3, volumeIn3, bbox: { w, d, h }, fileSizeMB }
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { volumeAndBbox } from './volumeAndBbox';

const loader = new STLLoader();

export const parseStl = (arrayBuffer, fileSizeBytes) => {
	let geometry;
	try {
		geometry = loader.parse(arrayBuffer);
	} catch {
		throw new Error('PARSE_FAILED');
	}
	const positions = geometry.attributes && geometry.attributes.position
		&& geometry.attributes.position.array;
	if (!positions || positions.length === 0) throw new Error('PARSE_FAILED');

	const measurements = volumeAndBbox(positions);
	return {
		mode: '3d',
		...measurements,
		fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
	};
};
