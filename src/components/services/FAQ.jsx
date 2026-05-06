import useSanityQuery from '../../hooks/useSanityQuery';

// FAQ docs reference `process` enum entries via `service[]`. Filter by service key.
const FAQ_QUERY = `*[_type == "faq" && $serviceKey in service[]->key] | order(order asc){
  _id, question, answer, order
}`;

// Renders portable text as plain text (no rich styling) per PATTERNS limitation.
// Owner can ship plain prose answers; rich text is a v2 enhancement (would require
// adding @portabletext/react, which CONTEXT.md doesn't authorize for Phase 2).
const renderAnswer = (answer) => {
	if (!Array.isArray(answer)) return null;
	return answer.map((block, i) => {
		if (!block || !Array.isArray(block.children)) return null;
		const text = block.children.map((c) => c?.text ?? '').join('');
		return (
			<p
				key={block._key ?? i}
				className="text-ternary-dark dark:text-ternary-light"
			>
				{text}
			</p>
		);
	});
};

const FAQ = ({ serviceKey }) => {
	const { data, loading } = useSanityQuery(FAQ_QUERY, { serviceKey }, [serviceKey]);
	const items = data ?? [];

	if (!loading && items.length === 0) {
		return (
			<section className="py-12 sm:py-24">
				<div className="container mx-auto">
					<h2 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-8">
						FAQ coming soon
					</h2>
					<p className="text-ternary-dark dark:text-ternary-light">
						Have a question we haven't covered?{' '}
						<a href="/contact" className="hover:text-accent">
							Contact us
						</a>
						.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className="py-12 sm:py-24">
			<div className="container mx-auto">
				<h2 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-8">
					FAQ
				</h2>
				<div className="space-y-4">
					{items.map((item) => (
						<details
							key={item._id}
							className="bg-secondary-section-dark p-6 rounded-xl"
						>
							<summary className="font-general-medium text-lg text-primary-light cursor-pointer">
								{item.question}
							</summary>
							<div className="mt-4 space-y-2">{renderAnswer(item.answer)}</div>
						</details>
					))}
				</div>
			</div>
		</section>
	);
};

export default FAQ;
