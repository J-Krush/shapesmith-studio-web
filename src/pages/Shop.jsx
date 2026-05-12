import { lazy, Suspense } from 'react';
import { ShopProvider, useShop } from '../context/ShopContext';
import SEOHead from '../components/shared/SEOHead';

// Plan 05-04 — /shop router branch.
// Branches between the empty-state Coming Soon page (Phase 2 D-23 byte-stable)
// and the catalog grid (Phase 5 SHOP-05). SEOHead mounts at the route level
// so both branches inherit the same title/description/og:image (UI-SPEC §9).
const ShopComingSoon = lazy(() => import('../components/shop/ShopComingSoon'));
const ShopCatalog = lazy(() => import('../components/shop/ShopCatalog'));

const ShopRouter = () => {
	const { products, loading } = useShop();
	// Site convention (UI-SPEC §10): render null while data resolves — no spinner, no skeleton.
	if (loading) return null;
	return products.length === 0 ? <ShopComingSoon /> : <ShopCatalog products={products} />;
};

const Shop = () => (
	<ShopProvider>
		<SEOHead
			title="Shop"
			description="Pre-made laser-cut and 3D-printed pieces from Shapesmith Studio, ready to take home."
			ogUrl="https://shapesmith.studio/shop"
			ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio' }}
		/>
		<Suspense fallback={null}>
			<ShopRouter />
		</Suspense>
	</ShopProvider>
);

export default Shop;
