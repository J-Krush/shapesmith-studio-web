import useSanityQuery from '../../hooks/useSanityQuery';
import MaterialSingle from '../../materials/MaterialSingle';

// Filters materials by service. Per Plan 02-01 Task 4 deviation (owner-approved),
// the service-compatibility tag lives on a NEW field `material.services`
// (string array of `laser` | `print` | `both`) — NOT on `material.processes`,
// which holds laser-operation values (`Cut`, `engrave`, `etch`).
//
// CONTEXT.md D-06 (ref-array path) and D-07 (string-array fallback) are both
// SUPERSEDED by the deviation. See `02-SCHEMA-SPEC.md` §"Deviation from Plan
// 02-01 Task 4 Checkpoint" + `02-01-SUMMARY.md` Deviations §1 for the full record.
const MATERIALS_QUERY = `*[_type == "material" && $serviceKey in services] | order(order asc){
  _id, order, title, cuttingSpecs, description, disclaimer,
  listImage{ altText, asset->{ _id, url, altText } }
}`;

const MaterialsSection = ({ serviceKey }) => {
	const { data, loading } = useSanityQuery(MATERIALS_QUERY, { serviceKey }, [serviceKey]);
	const materials = data ?? [];

	return (
		<section id="materials" className="py-12 sm:py-24">
			<div className="container mx-auto">
				<h2 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-8">
					Materials
				</h2>
				{!loading && materials.length === 0 ? (
					<div>
						<p className="font-display font-bold text-xl text-ternary-dark dark:text-ternary-light mb-2">
							Materials coming soon
						</p>
						<p className="text-ternary-dark dark:text-ternary-light">
							We update this list as we add new stock.{' '}
							<a href="/contact" className="hover:text-accent">
								Contact us
							</a>{' '}
							for special-order materials.
						</p>
					</div>
				) : (
					materials.map((m) => (
						<MaterialSingle
							key={m._id}
							title={m.title}
							image={m.listImage}
							description={m.description}
							materialThickness={m.cuttingSpecs}
							processes={[]}
							disclaimer={m.disclaimer}
						/>
					))
				)}
			</div>
		</section>
	);
};

export default MaterialsSection;
