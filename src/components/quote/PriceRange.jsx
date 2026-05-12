// PriceRange — renders the Ballpark estimate $low – $high figure plus the
// non-dismissable disclaimer (legal-posture lock per QTE-05 + UI-SPEC §"Disclaimer
// placement"). Hidden when geometry, pricing, or quantity is missing.
//
// Number format: $24 for n < 1000, $1.2k for n >= 1000 (one-decimal kilo-suffix).
// Separator: U+2013 EN DASH (–) per RESEARCH §Code Examples line 1036 — UI-SPEC
// calls it an em dash colloquially, but the actual codepoint is en dash.
import { motion } from 'framer-motion';
import { calculatePrice } from '../../utilities/quote/calculatePrice';

const formatUsd = (n) => {
	if (!isFinite(n) || isNaN(n)) return '$—';
	if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
	return `$${Math.round(n)}`;
};

const PriceRange = ({ geometry, pricing, quantity }) => {
	if (!geometry || !pricing || !quantity || quantity < 1) return null;
	const range = calculatePrice(geometry, pricing, quantity);

	return (
		<div className="mt-8 mb-2">
			<p className="text-base font-general-medium text-ternary-light mb-2">
				Ballpark estimate
			</p>
			{/* UI-SPEC §Color "Accent reserved for" #6 — text-accent here is the
			    ONLY non-CTA accent content use in the codebase. Justified because
			    the price-range IS the tool's primary output. */}
			<motion.span
				key={`${range.low.toFixed(2)}-${range.high.toFixed(2)}`}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.15 }}
				className="block text-3xl sm:text-4xl font-display font-bold text-accent"
			>
				{formatUsd(range.low)} – {formatUsd(range.high)}
			</motion.span>
			{/* Legal-posture lock — disclaimer NEVER moved into a tooltip or modal
			    per UI-SPEC §"Disclaimer placement" + QTE-05. Always visible
			    directly below the range. */}
			<p className="text-sm text-ternary-section-dark mt-2">
				This is an estimate. Final price comes after we review your file — not a binding quote.
			</p>
			<p className="text-sm text-ternary-section-dark mt-1">
				Pricing includes a small buffer for setup, finishing, and time. We&rsquo;ll tighten it up when we confirm.
			</p>
		</div>
	);
};

export default PriceRange;
