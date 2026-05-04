import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./utilities/sanityClient', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
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
