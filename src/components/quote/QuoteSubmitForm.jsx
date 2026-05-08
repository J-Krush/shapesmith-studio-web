// QuoteSubmitForm — visitor → owner-email handoff. Mounted inside QuoteTabs
// once the visitor has a real range (geometry + material with pricing + quantity).
//
// Plan 03-03 Task 3 (GREEN). Mirrors ContactForm.jsx submission lifecycle:
//   idle → submit → submitting → success (full-form replacement) | failure (inline alert)
//
// Submission shape difference from ContactForm: this POSTs JSON to a Netlify
// FUNCTION (not URL-encoded form data to /). Endpoint URL is RELATIVE so the
// same code works under `netlify dev` (port 8888) and in production.
//
// reCAPTCHA v3:
//   - Token minted client-side via `useGoogleReCaptcha`'s `executeRecaptcha`.
//   - Action namespaced as `submit_quote` so the Google admin UI shows the
//     score distribution per action.
//   - When REACT_APP_RECAPTCHA_SITE_KEY is unset (e.g. local dev without env
//     vars), the provider mounts but the script never loads, so
//     `executeRecaptcha` stays `undefined` — we surface a helpful inline
//     message instead of throwing.
//
// Plan 03-04 (QTE-10): `onSubmitted` is fired AFTER setSubmitted(true) on a
// successful 2xx round-trip. QuoteTabs passes `() => setQuoteState(null)` so
// the auto-clear-on-submit rule kicks in — the next visitor on the same
// browser sees a fresh form, not a stale "we restored your selections"
// banner pointing at someone else's choices.
import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import FormInput from '../reusable/FormInput';

const QuoteSubmitForm = ({ payload, onSubmitted }) => {
	const { executeRecaptcha } = useGoogleReCaptcha();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitError(null);
		if (!executeRecaptcha) {
			setSubmitError(
				"Spam protection isn't loaded yet. Try again in a moment, or contact us directly.",
			);
			return;
		}
		setSubmitting(true);
		try {
			const recaptchaToken = await executeRecaptcha('submit_quote');
			const res = await fetch('/.netlify/functions/submit-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...payload, name, email, message, recaptchaToken }),
			});
			if (!res.ok) throw new Error(`HTTP_${res.status}`);
			setSubmitted(true);
			// Plan 03-04 — auto-clear localStorage entry per QTE-10 so the next
			// visitor on the same browser does not see a stale restore banner.
			onSubmitted?.();
		} catch (err) {
			console.error('Quote submit failed:', err);
			setSubmitError(
				'Something went wrong sending this. Try again, or email us directly.',
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		// Full-form replacement panel — mirrors ContactForm.jsx:84-99.
		return (
			<div className="text-center max-w-xl mx-auto m-4 p-6 sm:p-10 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left">
				<span className="font-general-medium text-2xl mb-8">👍 </span>
				<p className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-4">
					Got it &mdash; we&rsquo;ll be in touch.
				</p>
				<p className="text-base text-ternary-dark dark:text-ternary-light">
					We&rsquo;ve got your details and your file metadata. We&rsquo;ll reply with a real quote within 1 business day.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mt-8 max-w-xl">
			<p className="text-sm text-ternary-light mb-4">
				We&rsquo;ll review your file and reply with a real quote &mdash; usually within 1 business day.
			</p>
			<FormInput
				inputLabel="Your name"
				labelFor="quote-name"
				inputType="text"
				inputId="quote-name"
				inputName="quote-name"
				placeholderText="Name"
				ariaLabelName="Name"
				required={true}
				onChange={(e) => setName(e.target.value)}
			/>
			<FormInput
				inputLabel="Email"
				labelFor="quote-email"
				inputType="email"
				inputId="quote-email"
				inputName="quote-email"
				placeholderText="Email"
				ariaLabelName="Email"
				required={true}
				onChange={(e) => setEmail(e.target.value)}
			/>
			<div className="mt-6">
				<label
					className="block text-lg text-primary-dark dark:text-primary-light mb-1"
					htmlFor="quote-message"
				>
					Anything else? <span className="text-sm text-ternary-section-dark">(optional)</span>
				</label>
				<textarea
					id="quote-message"
					name="quote-message"
					rows="4"
					aria-label="Message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					className="w-full px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md"
				/>
			</div>
			<button
				type="submit"
				disabled={submitting}
				className={
					submitting
						? 'font-general-medium px-5 py-2.5 text-white bg-accent/60 cursor-not-allowed rounded-md mt-6'
						: 'font-general-medium w-full sm:w-auto px-5 py-2.5 text-white bg-accent hover:bg-accent-highlight focus:ring-1 focus:ring-accent rounded-md mt-6 duration-500'
				}
			>
				{submitting ? 'Sending…' : 'Send this for a real quote'}
			</button>
			{submitError && (
				<p className="mt-4 text-sm text-red-400" role="alert">
					{submitError}
				</p>
			)}
		</form>
	);
};

export default QuoteSubmitForm;
