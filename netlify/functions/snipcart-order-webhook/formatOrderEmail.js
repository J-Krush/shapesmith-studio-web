// netlify/functions/snipcart-order-webhook/formatOrderEmail.js
//
// Pure function — unit-testable. Builds a plain-text owner email body from
// the Snipcart order.completed webhook payload's `content` object. Mirrors
// the idiom used by netlify/functions/submit-quote/formatQuoteText.js
// (CommonJS export, line arrays joined with '\n', defensive optional-chain
// reads against partial payloads).
//
// Plan 05-07 Task 1 (GREEN). Source: RESEARCH §"Pattern 5: Webhook Signature
// Validation" — formatOrderEmail.js code block.
//
// Defensive design notes:
//   - Snipcart's webhook payload shape is documented across multiple support
//     threads but not pinned to a canonical schema reference (RESEARCH A4).
//     Every field access uses optional chaining + a fallback so a missing
//     field never throws — the owner gets a partial email instead of a
//     500 cascading into a Snipcart retry storm.
//   - itemsCount pluralization handles the singular/plural English form
//     (1 item / 2 items) so the email reads naturally.
//   - The dashboard link is always emitted (even when token is missing)
//     so the owner can open the dashboard manually as a recovery path.

const formatOrderEmail = (order) => {
	if (!order) return 'Order data missing — see Snipcart dashboard.';

	const lines = [];
	lines.push(`New order: ${order.invoiceNumber ?? '???'}`);
	const itemsCount = order.itemsCount ?? 0;
	lines.push(
		`Total: $${order.finalGrandTotal ?? '?'} (${itemsCount} item${itemsCount === 1 ? '' : 's'})`,
	);
	lines.push('');
	lines.push('Customer:');
	lines.push(`  ${order.billingAddress?.fullName ?? 'unknown'}`);
	lines.push(`  ${order.email ?? 'no email'}`);
	if (order.phone) lines.push(`  ${order.phone}`);
	lines.push('');
	lines.push('Ship to:');
	const ship = order.shippingAddress ?? order.billingAddress ?? {};
	lines.push(`  ${ship.fullName ?? ''}`);
	lines.push(`  ${ship.address1 ?? ''}${ship.address2 ? ` ${ship.address2}` : ''}`);
	lines.push(`  ${ship.city ?? ''}, ${ship.province ?? ''} ${ship.postalCode ?? ''}`);
	lines.push(`  ${ship.country ?? ''}`);
	lines.push('');
	lines.push(`Shipping method: ${order.shippingMethod ?? 'n/a'} ($${order.shippingFees ?? 0})`);
	lines.push('');
	lines.push('Items:');
	for (const item of order.items ?? []) {
		lines.push(`  - ${item.quantity}× ${item.name} — $${item.totalPrice}`);
		if (item.description) lines.push(`      ${item.description}`);
	}
	lines.push('');
	if (order.token) {
		lines.push(`Dashboard: https://app.snipcart.com/dashboard/orders/${order.token}`);
	} else {
		lines.push('Dashboard: https://app.snipcart.com/dashboard/orders/');
	}
	return lines.join('\n');
};

module.exports = formatOrderEmail;
