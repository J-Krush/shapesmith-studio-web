// Plan 05-02 RED — failing tests for the props-driven ImageGallery primitive.
//
// Contract (per PLAN must_haves + <interfaces>):
//   ImageGallery({ images, alt, placeholderCaption })
//   - images: array of Sanity image objects (may be undefined or empty)
//   - alt: string fallback alt text used when an individual image has no altText
//   - placeholderCaption: string passed to <SanityImage placeholderCaption=...>
//
// Hard rules:
//   - ZERO context coupling — no useSingleService, no useServices
//   - Renders thumbnail grid + click-to-open lightbox identically to ServiceGallery
//   - Tailwind classes byte-stable with the source ServiceGallery
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ImageGallery from './ImageGallery';

// Stub urlFor so SanityImage doesn't try to talk to @sanity/image-url with a
// real-looking image record. We pass image objects with `asset` set so the
// SanityImage rendering branch (not the Placeholder branch) is exercised.
vi.mock('../../utilities/sanityImage', () => ({
	urlFor: () => ({
		width: () => ({
			auto: () => ({
				quality: () => ({ url: () => 'https://cdn.example/test.jpg' }),
			}),
		}),
	}),
}));

const makeImage = (id, altText) => ({
	altText,
	asset: { _id: id, url: `https://cdn.example/${id}.jpg`, altText },
});

test('renders without throwing when images is empty', () => {
	const { container } = render(
		<ImageGallery images={[]} alt="Title" placeholderCaption="x" />,
	);
	// Outer container present, no thumbnail items rendered, no lightbox open.
	expect(container.querySelector('.flex.w-1\\/3')).toBeNull();
	expect(container.querySelector('.fixed.top-0.left-0')).toBeNull();
});

test('renders without throwing when images is undefined', () => {
	const { container } = render(
		<ImageGallery alt="Title" placeholderCaption="x" />,
	);
	expect(container.querySelector('.flex.w-1\\/3')).toBeNull();
});

test('renders one thumbnail wrapped in a clickable div for a single image', () => {
	const images = [makeImage('img-1', 'First')];
	const { container } = render(
		<ImageGallery images={images} alt="Title" placeholderCaption="x" />,
	);
	const thumbWrappers = container.querySelectorAll('.flex.w-1\\/3');
	expect(thumbWrappers.length).toBe(1);
	const clickable = container.querySelector('.cursor-pointer');
	expect(clickable).not.toBeNull();
});

test('clicking a thumbnail opens a fullscreen lightbox', () => {
	const images = [makeImage('img-1', 'Alt-One')];
	const { container } = render(
		<ImageGallery images={images} alt="Title" placeholderCaption="x" />,
	);
	// No lightbox initially.
	expect(container.querySelector('.fixed.top-0.left-0')).toBeNull();

	const clickable = container.querySelector('.cursor-pointer');
	fireEvent.click(clickable);

	// Lightbox open: full-screen overlay with the documented class chain present.
	const lightbox = container.querySelector(
		'.fixed.top-0.left-0.z-80.w-screen.h-screen',
	);
	expect(lightbox).not.toBeNull();

	// Lightbox image uses max-h/max-w/object-contain.
	const lightboxImg = container.querySelector(
		'.max-h-\\[90vh\\].max-w-\\[90vw\\].object-contain',
	);
	expect(lightboxImg).not.toBeNull();
});

test('lightbox close button closes the lightbox', () => {
	const images = [makeImage('img-1', 'Alt-One')];
	const { container } = render(
		<ImageGallery images={images} alt="Title" placeholderCaption="x" />,
	);
	fireEvent.click(container.querySelector('.cursor-pointer'));
	expect(container.querySelector('.fixed.top-0.left-0')).not.toBeNull();

	// Close button is fixed top-6 right-8 with text-5xl.
	const closeBtn = container.querySelector('button.fixed.z-90.top-6.right-8');
	expect(closeBtn).not.toBeNull();
	fireEvent.click(closeBtn);
	expect(container.querySelector('.fixed.top-0.left-0')).toBeNull();
});

test('per-image alt fallback chain: image.altText > alt prop > empty', () => {
	const images = [
		makeImage('img-with-alt', 'PerImage'),
		makeImage('img-no-alt', undefined),
	];
	const { container } = render(
		<ImageGallery images={images} alt="PropFallback" placeholderCaption="x" />,
	);
	// The per-image alt should win for the first thumbnail.
	const imgs = container.querySelectorAll('img');
	expect(imgs.length).toBe(2);
	// At least one img must have alt="PerImage" and at least one with alt="PropFallback".
	const altValues = Array.from(imgs).map((i) => i.getAttribute('alt'));
	expect(altValues).toContain('PerImage');
	expect(altValues).toContain('PropFallback');
});

test('does NOT depend on useSingleService or useServices contexts (pure props)', () => {
	// If ImageGallery tried to call useSingleService(), the destructuring of an
	// undefined context value would throw. Rendering bare without any provider
	// proves the primitive is context-free.
	const images = [makeImage('img-1', 'Alt-One')];
	expect(() =>
		render(
			<ImageGallery
				images={images}
				alt="Title"
				placeholderCaption="x"
			/>,
		),
	).not.toThrow();
});
