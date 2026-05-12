// Plan 05-05 — Detail-page spec table (Dimensions / Materials / Ships in).
//
// Source-of-truth: UI-SPEC §11 (markup) + PATTERNS.md §"src/components/shop/
// ProductSpecTable.jsx" (omit-empty pattern + studio-info fallback chain).
//
// Hard rules:
//   - <dl> semantic markup (NOT <table> — this is metadata pairs).
//   - Omit-empty per row: skip the <dt>+<dd> pair entirely if the source
//     value is empty (TrustCopyBlock.jsx:14-19, 25-32 idiom).
//   - Materials links resolve per material.services tag (Phase 2 D-06):
//     'laser' → /styles#materials, otherwise → /3d-printing#materials.
//   - Lead-time fallback chain: product.leadTime → studio-info.shippingLeadTime
//     → "Contact us" copy. studio-info fetched via useSanityQuery.
//   - Materials joiner is " · " (middle dot), NOT comma.
import { Link } from 'react-router-dom';
import useSanityQuery from '../../hooks/useSanityQuery';

const STUDIO_INFO_QUERY = `*[_type == "studio-info"][0]{ shippingLeadTime }`;

// material.services is a string[] like ['laser'], ['print'], or ['laser','print'].
// Anchor decision: if the material is laser-eligible, point at /styles
// (the laser materials section); otherwise at /3d-printing.
const materialAnchor = (m) =>
	m?.services?.includes('laser') ? '/styles#materials' : '/3d-printing#materials';

const ProductSpecTable = ({ product }) => {
	const { data } = useSanityQuery(STUDIO_INFO_QUERY);
	const studioInfo = data ?? {};
	const leadTime = product?.leadTime ?? studioInfo.shippingLeadTime;
	const hasMaterials = Array.isArray(product?.materials) && product.materials.length > 0;
	const hasDimensions = !!product?.dimensions;
	const hasLeadTime = !!leadTime;

	// Whole-table omit: if every row would be empty (no dimensions, no
	// materials, AND no leadTime from either source), render nothing rather
	// than an empty <dl> with just the contact-us fallback row.
	if (!hasMaterials && !hasDimensions && !hasLeadTime) {
		return null;
	}

	// Materials cell: render each as a Link, joined by " · " separators.
	const materialNodes = hasMaterials
		? product.materials.reduce((acc, m, i) => {
				if (i > 0) acc.push(<span key={`sep-${m._id ?? i}`}> · </span>);
				acc.push(
					<Link
						key={m._id ?? `mat-${i}`}
						to={materialAnchor(m)}
						className="underline hover:text-accent duration-500"
					>
						{m.name}
					</Link>,
				);
				return acc;
		  }, [])
		: null;

	return (
		<dl className="border-t border-secondary-section-dark mt-12 pt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
			{hasDimensions && (
				<>
					<dt className="text-sm text-ternary-section-dark font-general-medium uppercase tracking-wide">
						Dimensions
					</dt>
					<dd className="text-base text-ternary-light">{product.dimensions}</dd>
				</>
			)}
			{hasMaterials && (
				<>
					<dt className="text-sm text-ternary-section-dark font-general-medium uppercase tracking-wide">
						Materials
					</dt>
					<dd className="text-base text-ternary-light">{materialNodes}</dd>
				</>
			)}
			<dt className="text-sm text-ternary-section-dark font-general-medium uppercase tracking-wide">
				Ships in
			</dt>
			<dd className="text-base text-ternary-light">
				{leadTime ?? (
					<>
						Contact{' '}
						<Link to="/contact" className="underline hover:text-accent duration-500">
							us
						</Link>{' '}
						for a lead-time estimate.
					</>
				)}
			</dd>
		</dl>
	);
};

export default ProductSpecTable;
