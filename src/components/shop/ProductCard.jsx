import { Link } from 'react-router-dom';
import SanityImage from '../shared/SanityImage';
import SoldOutBadge from './SoldOutBadge';
import LowStockTag from './LowStockTag';

// Plan 05-04 — Product grid card.
// Image + name + price + sold-out / low-stock states (CONTEXT D-10, D-16, UI-SPEC §1).
// Card is dark-only (bg-ternary-dark, no light/dark pair) per UI-SPEC §Color +
// the Phase 1 light-token strip on shop surfaces.
//
// LOW_STOCK_THRESHOLD lives here per the plan's hard rule — copy or extract a
// helper if a second consumer materializes (Plan 05's ProductInfo).
const LOW_STOCK_THRESHOLD = 3; // CONTEXT D-06 (planner discretion)

const ProductCard = ({ product }) => {
	const { name, slug, price, stockQuantity, images } = product;
	const heroImage = images?.[0];
	const isSoldOut = stockQuantity === 0;
	const isLowStock = stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;

	return (
		<Link to={`/shop/${slug}`} aria-label={name}>
			<div className="rounded-xl shadow-lg hover:shadow-xl cursor-pointer mb-10 sm:mb-0 bg-ternary-dark">
				<div className="relative">
					<SanityImage
						source={heroImage}
						alt={heroImage?.altText ?? name}
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						loading="lazy"
						className="aspect-square object-cover rounded-xl"
						placeholderCaption="Product photo coming soon"
					/>
					{isSoldOut && <SoldOutBadge />}
				</div>
				<div className="text-center px-4 py-6">
					<p className="font-general-medium text-lg text-ternary-light mb-2">{name}</p>
					<p className="font-general-regular text-lg text-primary-light">
						${price.toFixed(2)}
						{isLowStock && <LowStockTag n={stockQuantity} />}
					</p>
				</div>
			</div>
		</Link>
	);
};

export default ProductCard;
