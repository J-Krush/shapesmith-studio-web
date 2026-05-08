// Plan 03-03 Task 3 RED — failing tests for QuoteSubmitForm.
//
// Mocks `react-google-recaptcha-v3`'s `useGoogleReCaptcha` hook so the test runs
// without booting the real reCAPTCHA script (which requires a network round-trip
// to https://www.google.com/recaptcha/...). The component only consumes the
// `executeRecaptcha` callback returned by the hook.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Default mock — token mint resolves with a fake token. Individual tests
// override the hook's `executeRecaptcha` reference (notably setting it to
// undefined to simulate the "script hasn't loaded yet" state) without
// re-mocking the module — `jest.resetModules` would also reset React, breaking hooks.
//
// Names must be prefixed with `mock` so Jest's mock-factory hoist allows the
// closure to reference them before they're initialized at file-evaluation time.
const mockExecuteRecaptcha = jest.fn(() => Promise.resolve('FAKE_TOKEN_VALUE'));
const mockUseGoogleReCaptchaState = { executeRecaptcha: mockExecuteRecaptcha };
jest.mock('react-google-recaptcha-v3', () => ({
	useGoogleReCaptcha: () => mockUseGoogleReCaptchaState,
	GoogleReCaptchaProvider: ({ children }) => children,
}));

// Imported AFTER the mock so the real module never resolves.
const QuoteSubmitForm = require('./QuoteSubmitForm').default;

const BASE_PAYLOAD = {
	service: 'print',
	metadata: {
		filename: 'unit-cube.stl',
		fileSizeMB: 0.5,
		materialName: 'PLA — Black',
		quantity: 1,
		priceLow: 24,
		priceHigh: 38,
		volumeCm3: 1.0,
		bbox: '10 × 10 × 10 mm',
		triangleCount: 12,
	},
};

const fillRequired = () => {
	fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Joel' } });
	fireEvent.change(screen.getByLabelText(/^email$/i), {
		target: { value: 'joel@example.com' },
	});
};

beforeEach(() => {
	mockExecuteRecaptcha.mockClear();
	mockExecuteRecaptcha.mockImplementation(() => Promise.resolve('FAKE_TOKEN_VALUE'));
	mockUseGoogleReCaptchaState.executeRecaptcha = mockExecuteRecaptcha;
	global.fetch = jest.fn();
});

afterEach(() => {
	delete global.fetch;
});

test('renders name + email + message fields and the submit CTA copy', () => {
	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);
	expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
	expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
	expect(screen.getByLabelText(/anything else/i)).toBeInTheDocument();
	expect(
		screen.getByRole('button', { name: /send this for a real quote/i }),
	).toBeInTheDocument();
});

test('renders the response-time reminder above the submit button', () => {
	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);
	// JSX uses &rsquo; (U+2019 right single quote), not a straight apostrophe.
	expect(
		screen.getByText(/we[’']ll review your file and reply with a real quote/i),
	).toBeInTheDocument();
});

test('successful submit: mints token + POSTs JSON to /.netlify/functions/submit-quote + shows success panel', async () => {
	global.fetch.mockResolvedValueOnce({ ok: true });
	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);

	fillRequired();
	fireEvent.submit(screen.getByRole('button', { name: /send this for a real quote/i }).closest('form'));

	await waitFor(() => expect(global.fetch).toHaveBeenCalled());
	expect(mockExecuteRecaptcha).toHaveBeenCalledWith('submit_quote');

	const [url, init] = global.fetch.mock.calls[0];
	expect(url).toBe('/.netlify/functions/submit-quote');
	expect(init.method).toBe('POST');
	expect(init.headers['Content-Type']).toBe('application/json');
	const body = JSON.parse(init.body);
	expect(body).toMatchObject({
		service: 'print',
		name: 'Joel',
		email: 'joel@example.com',
		recaptchaToken: 'FAKE_TOKEN_VALUE',
		metadata: BASE_PAYLOAD.metadata,
	});

	// JSX renders `Got it — we’ll be in touch.` (U+2014 em-dash, U+2019 apostrophe).
	await screen.findByText(/got it [—-] we[’']ll be in touch\./i);
});

test('button shows "Sending…" and is disabled while submitting', async () => {
	let resolveFetch;
	global.fetch.mockReturnValueOnce(
		new Promise((resolve) => {
			resolveFetch = resolve;
		}),
	);
	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);
	fillRequired();
	fireEvent.submit(screen.getByRole('button', { name: /send this for a real quote/i }).closest('form'));

	await waitFor(() => {
		expect(screen.getByRole('button', { name: /sending…/i })).toBeDisabled();
	});

	resolveFetch({ ok: true });
});

test('non-2xx server response shows inline role="alert" and the button stays clickable', async () => {
	global.fetch.mockResolvedValueOnce({ ok: false, status: 502 });
	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);
	fillRequired();
	fireEvent.submit(screen.getByRole('button', { name: /send this for a real quote/i }).closest('form'));

	const alert = await screen.findByRole('alert');
	expect(alert).toHaveTextContent(/something went wrong/i);
	expect(screen.getByRole('button', { name: /send this for a real quote/i })).not.toBeDisabled();
});

test('network failure (fetch throws) shows the same inline error', async () => {
	global.fetch.mockRejectedValueOnce(new Error('Network down'));
	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);
	fillRequired();
	fireEvent.submit(screen.getByRole('button', { name: /send this for a real quote/i }).closest('form'));

	const alert = await screen.findByRole('alert');
	expect(alert).toHaveTextContent(/something went wrong/i);
});

test('reCAPTCHA hook not ready (executeRecaptcha undefined) shows a helpful inline error and does NOT POST', async () => {
	// Simulate the hook returning before script-load: executeRecaptcha is undefined.
	mockUseGoogleReCaptchaState.executeRecaptcha = undefined;

	render(<QuoteSubmitForm payload={BASE_PAYLOAD} />);
	fillRequired();
	fireEvent.submit(screen.getByRole('button', { name: /send this for a real quote/i }).closest('form'));

	const alert = await screen.findByRole('alert');
	expect(alert).toHaveTextContent(/spam protection/i);
	expect(global.fetch).not.toHaveBeenCalled();
});
