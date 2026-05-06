import { useState } from 'react';
import SEOHead from '../components/shared/SEOHead';
import encodeFormData from '../utilities/encodeFormData';

// /shop Coming Soon page (D-23).
// Email-capture form posts to a SEPARATE Netlify form `shop-notify` (NOT contact-form).
// Honeypot uses off-screen positioning per D-26 (sophisticated bots skip
// CSS-hidden fields that use the display property, so we avoid that approach).
const Shop = () => {
	const [email, setEmail] = useState('');
	const [bot, setBot] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = (e) => {
		e.preventDefault();
		setError(null);
		fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: encodeFormData({
				'form-name': 'shop-notify',
				email,
				'bot-field': bot,
			}),
		})
			.then(() => setSubmitted(true))
			.catch((err) => {
				console.error('Shop notify submit failed:', err);
				setError('Something went wrong. Please try again or contact us directly.');
			});
	};

	return (
		<>
			<SEOHead
				title="Shop — coming soon"
				description="Pre-made laser-cut and 3D-printed pieces, ready to take home."
				ogUrl="https://shapesmith.studio/shop"
				ogImage={{ url: '/og-default.png', altText: 'Shapesmith Studio' }}
			/>
			<section className="py-12 sm:py-24 mt-12 sm:mt-24">
				<div className="container mx-auto text-center max-w-xl px-4">
					<h1 className="font-display font-black text-3xl sm:text-4xl text-primary-dark dark:text-primary-light mb-6">
						Shop — coming soon
					</h1>
					<p className="text-lg text-ternary-dark dark:text-ternary-light mb-8">
						Pre-made laser-cut and 3D-printed pieces, ready to take home — coming soon.
					</p>
					{submitted ? (
						<p className="text-lg text-primary-dark dark:text-primary-light">
							Thanks — we&rsquo;ll let you know.
						</p>
					) : (
						<form
							name="shop-notify"
							method="POST"
							data-netlify="true"
							data-netlify-honeypot="bot-field"
							onSubmit={handleSubmit}
						>
							<input type="hidden" name="form-name" value="shop-notify" />
							{/* CSS-hidden honeypot per D-26 (off-screen positioning). */}
							<div
								className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden"
								aria-hidden="true"
							>
								<label htmlFor="shop-bot-field">
									Don&rsquo;t fill this out if you&rsquo;re human:
								</label>
								<input
									id="shop-bot-field"
									name="bot-field"
									type="text"
									tabIndex={-1}
									autoComplete="off"
									value={bot}
									onChange={(e) => setBot(e.target.value)}
								/>
							</div>
							<input
								type="email"
								name="email"
								required
								placeholder="you@example.com"
								aria-label="Email"
								className="w-full max-w-sm px-5 py-2.5 rounded-md mb-4 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
							<div>
								<button
									type="submit"
									className="font-general-medium px-5 py-2.5 text-white bg-accent hover:bg-accent-highlight focus:ring-1 focus:ring-accent rounded-md duration-500"
								>
									Notify me when it launches
								</button>
							</div>
							{error && (
								<p className="mt-4 text-sm text-red-400">{error}</p>
							)}
						</form>
					)}
				</div>
			</section>
		</>
	);
};

export default Shop;
