// CONTACT-FORM CONTRACT: every field below MUST also appear in `public/index.html`'s
// hidden `<form name="contact-form">` block. See D-28 + RESEARCH §Pitfall 4.
// Fields: form-name, name, email, service, subject, message, bot-field.
// Mismatch = silent submission drop on Netlify deploy-time form prerender.
import { useEffect, useState } from 'react';
import FormInput from '../reusable/FormInput';
import useSanityQuery from '../../hooks/useSanityQuery';
import encodeFormData from '../../utilities/encodeFormData';
import { SERVICES } from '../../data/services';

// SERVICE_PREFILL_RULES — referrer URL pattern → service contactSubject (D-24).
// Order: ?service= query string first, then document.referrer match, then blank.
const SERVICE_PREFILL_RULES = SERVICES.map((s) => ({
	match: `/${s.urlSegment}`,
	contactSubject: s.contactSubject,
}));

const ContactForm = () => {
	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formService, setFormService] = useState('');
	const [formSubject, setFormSubject] = useState('');
	const [formMessage, setFormMessage] = useState('');
	const [formBotField, setFormBotField] = useState('');

	const [formSubmitted, setFormSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState(null);

	// Response-time promise (CTC-04 / D-27) — sourced from Sanity studio-info singleton.
	const { data: studioInfo } = useSanityQuery(
		`*[_type == "studio-info"][0]{ responseTimePromise }`
	);

	// Pre-fill the service dropdown from query string OR referrer (D-24).
	useEffect(() => {
		const queryService = new URLSearchParams(window.location.search).get(
			'service'
		);
		if (queryService) {
			const m = SERVICES.find(
				(s) => s.key === queryService || s.urlSegment === queryService
			);
			if (m) {
				setFormService(m.contactSubject);
				return;
			}
		}
		const referrer =
			(typeof document !== 'undefined' && document.referrer) || '';
		const rule = SERVICE_PREFILL_RULES.find((r) => referrer.includes(r.match));
		if (rule) setFormService(rule.contactSubject);
	}, []);

	const handleSubmit = (e) => {
		e.preventDefault();
		setSubmitError(null);
		fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: encodeFormData({
				'form-name': 'contact-form',
				name: formName,
				email: formEmail,
				service: formService,
				subject: formSubject,
				message: formMessage,
				'bot-field': formBotField,
			}),
		})
			.then(() => {
				setFormSubmitted(true);
			})
			.catch((err) => {
				console.error('Contact form submit failed:', err);
				setSubmitError(
					'Something went wrong sending your message. Please try again or email us directly.'
				);
			});
	};

	return (
		<div className="w-full">
			<div className="leading-loose">
				{formSubmitted ? (
					<div
						className="text-center max-w-xl m-4 p-6 sm:p-10 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left"
					>
						<span className="font-general-medium text-2xl mb-8">👍 </span>
						<p
							className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-8"
						>
							Thanks for your message!
						</p>
						<p
							className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-8"
						>
							We will be in touch shortly.
						</p>
					</div>
				) : (
					<form
						name="contact-form"
						method="POST"
						data-netlify="true"
						data-netlify-honeypot="bot-field"
						onSubmit={handleSubmit}
						className="max-w-xl m-4 p-6 sm:p-10 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left"
					>
						<p className="font-general-medium text-primary-dark dark:text-primary-light text-2xl mb-8">
							Contact Us for Inquiries and Custom Work
						</p>

						<input type="hidden" name="form-name" value="contact-form" />

						{/* CSS-hidden honeypot per D-26.
						    Off-screen positioning + aria-hidden + tabIndex=-1 +
						    autoComplete=off keeps it invisible to humans + assistive
						    tech but discoverable to naive form-fillers.
						    Sophisticated bots skip CSS-display-hidden fields, so we
						    use absolute positioning instead. */}
						<div
							className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden"
							aria-hidden="true"
						>
							<label htmlFor="bot-field">
								Don&rsquo;t fill this out if you&rsquo;re human:
							</label>
							<input
								id="bot-field"
								name="bot-field"
								type="text"
								tabIndex={-1}
								autoComplete="off"
								value={formBotField}
								onChange={(e) => setFormBotField(e.target.value)}
							/>
						</div>

						<FormInput
							inputLabel="Full Name"
							labelFor="name"
							inputType="text"
							inputId="name"
							inputName="name"
							placeholderText="Your Name"
							ariaLabelName="Name"
							required={true}
							onChange={(e) => setFormName(e.target.value)}
						/>
						<FormInput
							inputLabel="Email"
							labelFor="email"
							inputType="email"
							inputId="emailaddress"
							inputName="email"
							placeholderText="Your email"
							ariaLabelName="Email"
							required={true}
							onChange={(e) => setFormEmail(e.target.value)}
						/>

						{/* Service dropdown (D-25) — options driven by SERVICES. */}
						<div className="font-general-regular mb-4">
							<label
								className="block text-lg text-primary-dark dark:text-primary-light mb-1"
								htmlFor="service"
							>
								Service
							</label>
							<select
								id="service"
								name="service"
								value={formService}
								onChange={(e) => setFormService(e.target.value)}
								aria-label="Service"
								className="w-full px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md"
							>
								<option value="">Select a service…</option>
								{SERVICES.map((s) => (
									<option key={s.key} value={s.contactSubject}>
										{s.contactSubject}
									</option>
								))}
								<option value="Other">Other</option>
							</select>
						</div>

						<FormInput
							inputLabel="Subject"
							labelFor="subject"
							inputType="text"
							inputId="subject"
							inputName="subject"
							placeholderText="Subject"
							ariaLabelName="Subject"
							required={false}
							onChange={(e) => setFormSubject(e.target.value)}
						/>

						<div className="mt-6">
							<label
								className="block text-lg text-primary-dark dark:text-primary-light mb-2"
								htmlFor="message"
							>
								Message
							</label>
							<textarea
								className="w-full px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md"
								id="message"
								name="message"
								cols="14"
								rows="6"
								aria-label="Message"
								required={true}
								onChange={(e) => setFormMessage(e.target.value)}
							></textarea>
						</div>

						<button
							className="font-general-medium w-40 px-4 py-2.5 text-white text-center font-medium tracking-wider bg-accent hover:bg-accent-highlight focus:ring-1 focus:ring-accent rounded-lg mt-6 duration-500"
							type="submit"
							aria-label="Send Message"
						>
							Send
						</button>

						{/* Response-time promise (CTC-04 / D-27) — Sanity-driven.
						    Owner edits studio-info.responseTimePromise; no redeploy. */}
						{studioInfo?.responseTimePromise && (
							<p className="mt-4 text-sm text-ternary-dark dark:text-ternary-light">
								{studioInfo.responseTimePromise}
							</p>
						)}

						{submitError && (
							<p className="mt-4 text-sm text-red-400" role="alert">
								{submitError}
							</p>
						)}
					</form>
				)}
			</div>
		</div>
	);
};

export default ContactForm;
