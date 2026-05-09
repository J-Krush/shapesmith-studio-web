// Unit tests for the Snipcart order-completed email formatter.
//
// The helper lives at netlify/functions/snipcart-order-webhook/formatOrderEmail.js
// (CommonJS — Netlify Functions default runtime). Vitest interops `module.exports`
// transparently when imported via ESM `import` (matches Phase 3's Phase 3 test
// pattern in src/utilities/quote/formatQuoteText.test.js).
//
// Plan 05-07 Task 1.
//
// Behavioral contract (per PLAN.md <behavior>):
//   - Multi-line plain-text output.
//   - Starts with "New order: <invoiceNumber>".
//   - Includes total line, items count, customer block, shipping block,
//     shipping method, item lines, dashboard link.
//   - Defensive against undefined / partial / empty payloads.
import { describe, it, expect } from 'vitest';
import formatOrderEmail from '../formatOrderEmail.js';

const sampleOrder = {
	token: 'tok_abc',
	invoiceNumber: 'INV-001',
	finalGrandTotal: 33,
	itemsCount: 2,
	email: 'buyer@example.com',
	phone: '555-1234',
	billingAddress: { fullName: 'Alice Buyer' },
	shippingAddress: {
		fullName: 'Alice Buyer',
		address1: '1 Maple St',
		city: 'Springfield',
		province: 'IL',
		postalCode: '62701',
		country: 'US',
	},
	shippingMethod: 'USPS Priority',
	shippingFees: 9,
	items: [
		{ name: 'Walnut Coaster', quantity: 2, totalPrice: 24, description: 'Reclaimed walnut' },
	],
};

describe('formatOrderEmail', () => {
	it('returns the missing-data fallback when order is undefined', () => {
		expect(formatOrderEmail(undefined)).toMatch(/Order data missing/);
	});

	it('includes invoice number, total, items count, customer, address, items, and dashboard link', () => {
		const text = formatOrderEmail(sampleOrder);
		expect(text).toMatch(/New order: INV-001/);
		expect(text).toMatch(/Total: \$33 \(2 items\)/);
		expect(text).toMatch(/Alice Buyer/);
		expect(text).toMatch(/buyer@example\.com/);
		expect(text).toMatch(/555-1234/);
		expect(text).toMatch(/1 Maple St/);
		expect(text).toMatch(/Springfield, IL 62701/);
		expect(text).toMatch(/Shipping method: USPS Priority \(\$9\)/);
		expect(text).toMatch(/2× Walnut Coaster — \$24/);
		expect(text).toMatch(/Reclaimed walnut/);
		expect(text).toMatch(/dashboard\/orders\/tok_abc/);
	});

	it('handles single-item count without pluralization', () => {
		const text = formatOrderEmail({ ...sampleOrder, itemsCount: 1 });
		expect(text).toMatch(/Total: \$33 \(1 item\)/);
		expect(text).not.toMatch(/Total: \$33 \(1 items\)/);
	});

	it('handles empty items array gracefully', () => {
		const text = formatOrderEmail({ ...sampleOrder, items: [] });
		expect(text).toMatch(/Items:/);
		expect(() => formatOrderEmail({ ...sampleOrder, items: [] })).not.toThrow();
	});

	it('falls back to billingAddress when shippingAddress is missing', () => {
		const text = formatOrderEmail({
			...sampleOrder,
			shippingAddress: undefined,
			billingAddress: {
				fullName: 'Bob',
				address1: '2 Oak Ave',
				city: 'Peoria',
				province: 'IL',
				postalCode: '61602',
				country: 'US',
			},
		});
		expect(text).toMatch(/2 Oak Ave/);
	});
});
