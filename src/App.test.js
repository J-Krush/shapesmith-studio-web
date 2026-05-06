import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./utilities/sanityClient', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
}));

// `@sanity/image-url` ships as ESM — Jest 27 (CRA 5) without `transformIgnorePatterns`
// can't parse it. Mock the wrapper module so the smoke test (whose purpose is to verify
// routing + nav, not image rendering) doesn't pull the ESM dep through the require chain.
// Plan 02-02 Task 2 is what put SanityImage into App.js's import graph (via
// Materials -> MaterialSingle -> SanityImage). Plan 02-02 Task 3 then removes the
// Materials import from App.js, but the chain remains live (ServiceCard/ServiceGallery
// are still reached via Projects/ProjectSingle), so this mock stays.
jest.mock('./utilities/sanityImage', () => ({
  __esModule: true,
  urlFor: () => ({
    width: () => ({
      auto: () => ({
        quality: () => ({ url: () => 'mock://image' }),
      }),
    }),
  }),
  urlAt: () => 'mock://image',
}));

test('App mounts without crashing and renders persistent nav', async () => {
  render(<App />);
  // Header nav renders a Contact link in both the mobile and large-screen variants.
  // At least one match must appear in jsdom regardless of viewport.
  // `findAllByText` (async) is used because the mocked fetch returns Promise.resolve([])
  // which defers `setData` to a microtask — synchronous getAllByText would race the resolve
  // and could surface React act() warnings.
  const contactLinks = await screen.findAllByText(/contact/i);
  expect(contactLinks.length).toBeGreaterThan(0);
});
