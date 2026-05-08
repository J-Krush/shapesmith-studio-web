// Unit tests for the calculatePrice helper. Plan 03-02 Task 2 RED.
// Per QTE-05 lock: ALWAYS returns { low, high } — never collapses to a single
// number, even when markupBufferLow === markupBufferHigh.
import { calculatePrice } from './calculatePrice';

// Plan 03-02 <behavior> canonical fixture:
//   quantity=1, volumeCm3=24.5, ratePerCm3=0.5, setupFee=5,
//   machineTimeMultiplier=1.0, markupBufferLow=15, markupBufferHigh=25
//   base = (24.5 * 0.5 + 5) * 1.0 * 1 = 17.25
//   low  = 17.25 * 1.15 ≈ 19.8375
//   high = 17.25 * 1.25 ≈ 21.5625
const PRICING_3D = {
	ratePerCm3: 0.5,
	ratePerMm: null,
	machineTimeMultiplier: 1.0,
	setupFee: 5,
	density: 1.24,
	markupBufferLow: 15,
	markupBufferHigh: 25,
};

const PRICING_LASER = {
	ratePerCm3: null,
	ratePerMm: 0.05,
	machineTimeMultiplier: 1.0,
	setupFee: 3,
	density: null,
	markupBufferLow: 15,
	markupBufferHigh: 25,
};

const GEOMETRY_3D = {
	mode: '3d',
	triangleCount: 12,
	volumeCm3: 24.5,
	volumeIn3: 1.49,
	bbox: { w: 42, d: 30, h: 18 },
	fileSizeMB: 4.2,
};

const GEOMETRY_LASER = {
	mode: 'laser',
	bbox: { w: 100, h: 50 },
	pathLengthMm: 800,
	unitWarning: false,
	fileSizeMB: 0.05,
};

test('calculatePrice 3D base case: canonical fixture from <behavior>', () => {
	// base = (24.5 * 0.5 + 5) * 1.0 * 1 = 17.25
	// low ≈ 19.84, high ≈ 21.56 (rounded to 2dp)
	const r = calculatePrice(GEOMETRY_3D, PRICING_3D, 1);
	expect(r.low).toBeCloseTo(19.8375, 3);
	expect(r.high).toBeCloseTo(21.5625, 3);
});

test('calculatePrice laser base case: pathLength × ratePerMm + setupFee × multiplier × qty', () => {
	// base = (800 * 0.05 + 3) * 1.0 * 1 = 43
	// low = 43 * 1.15 = 49.45, high = 43 * 1.25 = 53.75
	const r = calculatePrice(GEOMETRY_LASER, PRICING_LASER, 1);
	expect(r.low).toBeCloseTo(49.45, 2);
	expect(r.high).toBeCloseTo(53.75, 2);
});

test('calculatePrice always returns { low, high } — never a single number (QTE-05 lock)', () => {
	// Even when markupBufferLow === markupBufferHigh, both fields exist and are equal.
	const flatPricing = { ...PRICING_3D, markupBufferLow: 20, markupBufferHigh: 20 };
	const r = calculatePrice(GEOMETRY_3D, flatPricing, 1);
	expect(r).toHaveProperty('low');
	expect(r).toHaveProperty('high');
	expect(typeof r.low).toBe('number');
	expect(typeof r.high).toBe('number');
	expect(r.low).toBeCloseTo(r.high, 5);
});

test('calculatePrice scales linearly with quantity (qty=2 → 2× base before markup)', () => {
	const r1 = calculatePrice(GEOMETRY_3D, PRICING_3D, 1);
	const r2 = calculatePrice(GEOMETRY_3D, PRICING_3D, 2);
	expect(r2.low).toBeCloseTo(r1.low * 2, 5);
	expect(r2.high).toBeCloseTo(r1.high * 2, 5);
});

test('calculatePrice 3D with multiplier > 1.0 lifts both low and high proportionally', () => {
	// multiplier 1.3 → base = 17.25 * 1.3 = 22.425
	// low = 22.425 * 1.15 = 25.78875, high = 22.425 * 1.25 = 28.03125
	const slowPricing = { ...PRICING_3D, machineTimeMultiplier: 1.3 };
	const r = calculatePrice(GEOMETRY_3D, slowPricing, 1);
	expect(r.low).toBeCloseTo(25.78875, 3);
	expect(r.high).toBeCloseTo(28.03125, 3);
});

test('calculatePrice high is always >= low when markupBufferHigh >= markupBufferLow', () => {
	const r = calculatePrice(GEOMETRY_3D, PRICING_3D, 1);
	expect(r.high).toBeGreaterThanOrEqual(r.low);
});
