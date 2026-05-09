// Plan 05-04 Task 2 RED — failing tests for ProductCard's three render branches.
//
// Contract (per PLAN.md <behavior>):
//   ProductCard({ product: { stockQuantity: 5, ... } }) → image + name + price (no badge)
//   ProductCard({ product: { stockQuantity: 2, ... } }) → card + inline "Only 2 left" tag
//   ProductCard({ product: { stockQuantity: 0, ... } }) → card + "Sold out" badge + overlay
//
// Hard rules:
//   - <Link to={`/shop/${slug}`}> wraps the entire card
//   - aria-label={name} on the link (matches ServiceCard.jsx convention)
//   - Threshold: stockQuantity ≤ 3 → low-stock; === 0 → sold out (CONTEXT D-06)
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';

// Stub urlFor so SanityImage doesn't try to talk to @sanity/image-url with a
// real-looking image record. We pass an image object with `asset` set so the
// SanityImage rendering branch (not the Placeholder branch) is exercised.
vi.mock('../../../utilities/sanityImage', () => ({
	urlFor: () => ({
		width: () => ({
			auto: () => ({
				quality: () => ({ url: () => 'https://cdn.example/test.jpg' }),
			}),
		}),
	}),
}));

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

const baseProduct = {
	_id: 'p1',
	name: 'Walnut Coaster',
	slug: 'walnut-coaster',
	price: 24,
	images: [
		{
			altText: 'Walnut Coaster',
			asset: { _id: 'img1', url: 'https://cdn.sanity.io/img1.jpg' },
		},
	],
};

describe('ProductCard', () => {
	test('renders name and price for an available product (no badges)', () => {
		renderWithRouter(<ProductCard product={{ ...baseProduct, stockQuantity: 5 }} />);
		expect(screen.getByText('Walnut Coaster')).toBeInTheDocument();
		expect(screen.getByText(/\$24\.00/)).toBeInTheDocument();
		expect(screen.queryByText(/Only \d+ left/)).toBeNull();
		expect(screen.queryByText('Sold out')).toBeNull();
	});

	test('renders the LowStockTag when stockQuantity is 1..3', () => {
		renderWithRouter(<ProductCard product={{ ...baseProduct, stockQuantity: 2 }} />);
		expect(screen.getByText('Only 2 left')).toBeInTheDocument();
		expect(screen.queryByText('Sold out')).toBeNull();
	});

	test('renders the SoldOutBadge when stockQuantity is 0', () => {
		renderWithRouter(<ProductCard product={{ ...baseProduct, stockQuantity: 0 }} />);
		expect(screen.getByText('Sold out')).toBeInTheDocument();
		expect(screen.queryByText(/Only \d+ left/)).toBeNull();
	});

	test('links to /shop/:slug', () => {
		renderWithRouter(<ProductCard product={{ ...baseProduct, stockQuantity: 5 }} />);
		const link = screen.getByRole('link', { name: 'Walnut Coaster' });
		expect(link).toHaveAttribute('href', '/shop/walnut-coaster');
	});
});
