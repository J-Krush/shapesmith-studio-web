// Plan 05-05 — /shop/:slug product detail page.
//
// Provider stack (mirrors ProjectSingle.jsx):
//   <ShopProvider>            — fetches the product list
//     <SingleProductProvider> — derives the matching product from useParams.slug
//       <ShopSingleInner />   — renders the page once product resolves
//
// Layout (UI-SPEC §2 + §3):
//   Image gallery LEFT (lg:w-7/12) / info column RIGHT (lg:w-5/12) on lg+,
//   stacked image-on-top on <lg:. The page section uses pb-16 md:pb-0 to
//   reserve bottom space on mobile for the sticky Add-to-Cart bar.
//
// Sticky-bar plumbing:
//   useRef(null) is created here and threaded as `buttonRef` to
//   <ProductInfo> (which attaches it to the in-content button wrapper) AND
//   `anchorRef` to <StickyMobileAddToCart> (which observes it via
//   IntersectionObserver). Single source of truth for the DOM node.
//
// SEO (UI-SPEC §Copywriting Contract /shop/:slug + RESEARCH Example 5):
//   title       = product.name
//   description = product.description
//   og:image    = first product image at width(1200), or /og-default.png
//   og:url      = https://shapesmith.studio/shop/{slug}
//
// Notes:
//   - if (!product) return null → unknown slug renders empty. The App.js
//     catch-all <Route path="*" element={<NotFound />} /> handles paths that
//     don't match /shop/:slug at all.
//   - framer-motion envelope mirrors ProjectSingle.jsx:80-90 — keeps the
//     page-mount cadence consistent with /styles/:slug + /3d-printing/:slug.
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ShopProvider } from '../context/ShopContext';
import { SingleProductProvider, useSingleProduct } from '../context/SingleProductContext';
import SEOHead from '../components/shared/SEOHead';
import ProductHeader from '../components/shop/ProductHeader';
import ProductInfo from '../components/shop/ProductInfo';
import StickyMobileAddToCart from '../components/shop/StickyMobileAddToCart';
import ImageGallery from '../components/shared/ImageGallery';
import { urlAt } from '../utilities/sanityImage';

const ShopSingleInner = () => {
	const { product, loading } = useSingleProduct();
	const buttonRef = useRef(null);

	// Site convention (UI-SPEC §10): render null while data resolves — no
	// spinner, no skeleton.
	if (loading) return null;
	if (!product) return null;

	const heroImage = product.images?.[0];
	const ogImage = heroImage?.asset
		? {
				url: urlAt(heroImage, 1200),
				altText: heroImage.altText ?? product.name,
		  }
		: { url: '/og-default.png', altText: 'Shapesmith Studio' };

	return (
		<>
			<SEOHead
				title={product.name}
				description={product.description}
				ogUrl={`https://shapesmith.studio/shop/${product.slug}`}
				ogImage={ogImage}
			/>
			<section className="container mx-auto px-4 py-12 sm:py-24 mt-0 sm:mt-12 pb-16 md:pb-0">
				<div className="lg:flex lg:gap-12">
					<div className="lg:w-7/12">
						<ImageGallery
							images={product.images}
							alt={product.name}
							placeholderCaption="Photo coming soon"
						/>
					</div>
					<div className="lg:w-5/12 mt-8 lg:mt-0">
						<ProductHeader />
						<ProductInfo buttonRef={buttonRef} />
					</div>
				</div>
			</section>
			<StickyMobileAddToCart product={product} anchorRef={buttonRef} />
		</>
	);
};

const ShopSingle = () => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1, delay: 1 }}
		transition={{ ease: 'easeInOut', duration: 0.6, delay: 0.15 }}
		className="container mx-auto"
	>
		<ShopProvider>
			<SingleProductProvider>
				<ShopSingleInner />
			</SingleProductProvider>
		</ShopProvider>
	</motion.div>
);

export default ShopSingle;
