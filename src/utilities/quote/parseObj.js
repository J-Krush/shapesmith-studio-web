// OBJ parser — Three.js's OBJLoader returns a Group of Meshes. We flatten every
// mesh's position attribute into a single Float32Array and run the SAME
// signed-tetrahedra volume + bbox helper as parseStl. Subpath import only.
//
// Output contract matches parseStl (mode: '3d').
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { volumeAndBbox } from './volumeAndBbox';

const loader = new OBJLoader();

export const parseObj = (text, fileSizeBytes) => {
	let group;
	try {
		group = loader.parse(text);
	} catch {
		throw new Error('PARSE_FAILED');
	}

	const chunks = [];
	let totalLength = 0;
	group.traverse((obj) => {
		if (obj.isMesh && obj.geometry && obj.geometry.attributes
			&& obj.geometry.attributes.position) {
			const arr = obj.geometry.attributes.position.array;
			chunks.push(arr);
			totalLength += arr.length;
		}
	});
	if (totalLength === 0) throw new Error('PARSE_FAILED');

	const positions = new Float32Array(totalLength);
	let off = 0;
	for (const chunk of chunks) {
		positions.set(chunk, off);
		off += chunk.length;
	}

	const measurements = volumeAndBbox(positions);
	return {
		mode: '3d',
		...measurements,
		fileSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
	};
};
