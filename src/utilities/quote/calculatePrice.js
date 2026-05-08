// Pure price calculator. No imports.
//
// Inputs:
//   geometry — { mode: '3d' | 'laser', volumeCm3?, pathLengthMm?, ... }
//   pricing  — { ratePerCm3, ratePerMm, machineTimeMultiplier, setupFee,
//                density, markupBufferLow, markupBufferHigh }
//   quantity — positive integer
//
// Output: { low, high } — TWO numbers ALWAYS (QTE-05 lock — never a single point,
// even when markupBufferLow === markupBufferHigh).
//
// 3D path:    base = (volumeCm3 * ratePerCm3 + setupFee) * machineTimeMultiplier * quantity
// Laser path: base = (pathLengthMm * ratePerMm + setupFee) * machineTimeMultiplier * quantity
//
// low  = base * (1 + markupBufferLow / 100)
// high = base * (1 + markupBufferHigh / 100)
export const calculatePrice = (geometry, pricing, quantity) => {
	const base =
		geometry.mode === '3d'
			? (geometry.volumeCm3 * pricing.ratePerCm3 + pricing.setupFee) *
			  pricing.machineTimeMultiplier *
			  quantity
			: (geometry.pathLengthMm * pricing.ratePerMm + pricing.setupFee) *
			  pricing.machineTimeMultiplier *
			  quantity;

	const low = base * (1 + pricing.markupBufferLow / 100);
	const high = base * (1 + pricing.markupBufferHigh / 100);
	return { low, high };
};
