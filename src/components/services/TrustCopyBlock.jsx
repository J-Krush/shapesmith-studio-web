import useSanityQuery from '../../hooks/useSanityQuery';

const STUDIO_INFO_QUERY = `*[_type == "studio-info"][0]{
  serviceArea, pickupAvailability, responseTimePromise
}`;

// Renders four trust facts: turnaround (per-service override) + serviceArea +
// pickup + response-time. Single row on desktop, stacked on mobile (UI-SPEC).
// Returns null if there is nothing to show — avoids an empty banded panel.
const TrustCopyBlock = ({ turnaround }) => {
	const { data } = useSanityQuery(STUDIO_INFO_QUERY);
	const info = data ?? {};

	const hasContent =
		turnaround ||
		info.serviceArea ||
		info.pickupAvailability ||
		info.responseTimePromise;
	if (!hasContent) return null;

	return (
		<section className="py-12 sm:py-24 bg-secondary-section-dark">
			<div className="container mx-auto">
				<div className="block sm:flex sm:gap-10 sm:justify-between text-primary-light">
					{turnaround && (
						<div className="mb-4 sm:mb-0">
							<p className="text-sm font-general-medium text-ternary-section-dark uppercase mb-1">
								Turnaround
							</p>
							<p className="font-general-regular">{turnaround}</p>
						</div>
					)}
					{info.pickupAvailability && (
						<div className="mb-4 sm:mb-0">
							<p className="text-sm font-general-medium text-ternary-section-dark uppercase mb-1">
								Pickup
							</p>
							<p className="font-general-regular">{info.pickupAvailability}</p>
						</div>
					)}
					{info.serviceArea && (
						<div className="mb-4 sm:mb-0">
							<p className="text-sm font-general-medium text-ternary-section-dark uppercase mb-1">
								Service area
							</p>
							<p className="font-general-regular">{info.serviceArea}</p>
						</div>
					)}
					{info.responseTimePromise && (
						<div>
							<p className="text-sm font-general-medium text-ternary-section-dark uppercase mb-1">
								Response
							</p>
							<p className="font-general-regular">{info.responseTimePromise}</p>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default TrustCopyBlock;
