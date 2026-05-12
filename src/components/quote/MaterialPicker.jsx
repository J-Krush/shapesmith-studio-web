// MaterialPicker — Sanity-driven <select> filtered by service via the GROQ
// pattern from MaterialsSection.jsx (extended with the pricing-rule join in
// QuoteTabs.jsx so we don't double-fetch). Pure visual; QuoteTabs owns state +
// the query.
//
// className strings on <select> mirror ContactForm.jsx:170-186 verbatim per
// UI-SPEC §"Material + quantity picker" (no custom dropdown component).
//
// MATERIALS_QUERY is exported so QuoteTabs can pass it to useSanityQuery.

export const MATERIALS_QUERY = `*[_type == "material" && $serviceKey in services] | order(order asc){
	_id, title,
	"pricing": *[_type == "pricing-rule" && references(^._id)][0]{
		ratePerCm3, ratePerMm, machineTimeMultiplier, setupFee, density,
		markupBufferLow, markupBufferHigh
	}
}`;

const MaterialPicker = ({ materials, loading, value, onChange }) => {
	if (!loading && materials.length === 0) {
		return (
			<p className="text-ternary-dark dark:text-ternary-light mb-4">
				We don&rsquo;t have any materials listed for this service yet.{' '}
				<a href="/contact" className="hover:text-accent">
					Contact us
				</a>{' '}
				and we&rsquo;ll talk through options.
			</p>
		);
	}

	return (
		<div className="font-general-regular mb-4">
			<label
				className="block text-lg text-primary-dark dark:text-primary-light mb-1"
				htmlFor="material"
			>
				Material
			</label>
			<select
				id="material"
				name="material"
				value={value || ''}
				onChange={onChange}
				disabled={loading}
				className="w-full px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md focus:ring-1 focus:ring-accent"
			>
				<option value="">{loading ? 'Loading materials…' : 'Pick a material…'}</option>
				{materials.map((m) => (
					<option key={m._id} value={m._id}>
						{m.title}
						{!m.pricing && ' (pricing not configured)'}
					</option>
				))}
			</select>
		</div>
	);
};

export default MaterialPicker;
