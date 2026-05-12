// Pure math: signed-tetrahedra volume + bbox from a flat positions array
// (every triangle = 9 consecutive floats, x0,y0,z0,x1,y1,z1,x2,y2,z2 in mm).
// Extracted from parseStl/parseObj so the math is testable without invoking
// Three.js's ESM-only loaders (which Jest 27 cannot transform without a config
// override that CRA 5 does not honor — see Plan 03-01 SUMMARY Deviations).
//
// Returns the same shape both parseStl and parseObj re-emit:
//   { triangleCount, volumeCm3, volumeIn3, bbox: { w, d, h } }
//
// `Math.abs(signedVolumeMm3)` is mandatory winding-flip safety per Pitfall 2.
export const volumeAndBbox = (positions) => {
	const triangleCount = positions.length / 9;
	let signedVolumeMm3 = 0;
	let minX = Infinity, minY = Infinity, minZ = Infinity;
	let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

	for (let i = 0; i < positions.length; i += 9) {
		const v0x = positions[i],     v0y = positions[i + 1], v0z = positions[i + 2];
		const v1x = positions[i + 3], v1y = positions[i + 4], v1z = positions[i + 5];
		const v2x = positions[i + 6], v2y = positions[i + 7], v2z = positions[i + 8];

		// Signed volume of tetrahedron (origin, v0, v1, v2) = (v0 . (v1 x v2)) / 6
		const cx = v1y * v2z - v1z * v2y;
		const cy = v1z * v2x - v1x * v2z;
		const cz = v1x * v2y - v1y * v2x;
		signedVolumeMm3 += (v0x * cx + v0y * cy + v0z * cz) / 6;

		if (v0x < minX) minX = v0x; if (v1x < minX) minX = v1x; if (v2x < minX) minX = v2x;
		if (v0y < minY) minY = v0y; if (v1y < minY) minY = v1y; if (v2y < minY) minY = v2y;
		if (v0z < minZ) minZ = v0z; if (v1z < minZ) minZ = v1z; if (v2z < minZ) minZ = v2z;
		if (v0x > maxX) maxX = v0x; if (v1x > maxX) maxX = v1x; if (v2x > maxX) maxX = v2x;
		if (v0y > maxY) maxY = v0y; if (v1y > maxY) maxY = v1y; if (v2y > maxY) maxY = v2y;
		if (v0z > maxZ) maxZ = v0z; if (v1z > maxZ) maxZ = v1z; if (v2z > maxZ) maxZ = v2z;
	}

	const volumeMm3 = Math.abs(signedVolumeMm3);
	const volumeCm3 = volumeMm3 / 1000;

	return {
		triangleCount,
		volumeCm3: Number(volumeCm3.toFixed(2)),
		volumeIn3: Number((volumeCm3 / 16.387).toFixed(2)),
		bbox: {
			w: Number((maxX - minX).toFixed(1)),
			d: Number((maxY - minY).toFixed(1)),
			h: Number((maxZ - minZ).toFixed(1)),
		},
	};
};
