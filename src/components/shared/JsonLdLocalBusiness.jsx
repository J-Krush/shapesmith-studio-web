import { Helmet } from 'react-helmet-async';
import useSanityQuery from '../../hooks/useSanityQuery';

const STUDIO_INFO_QUERY = `*[_type == "studio-info"][0]{
  name, description, serviceArea, telephone, url,
  address{ streetAddress, addressLocality, addressRegion, postalCode, addressCountry },
  sameAs, openingHours, areaServed, makesOffer,
  ogImage{ asset->{ url } }
}`;

// Homepage-only (D-21). Mount in src/pages/Home.jsx — Plan 04 owns that mount.
// Returns null when studio-info doc is empty or hasn't loaded — the homepage
// still renders, JSON-LD is just absent. Crawlers re-crawl when content lands.
const JsonLdLocalBusiness = () => {
	const { data } = useSanityQuery(STUDIO_INFO_QUERY);
	if (!data) return null;

	const ld = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: data.name ?? 'Shapesmith Studio',
		description: data.description,
		url: data.url ?? 'https://shapesmith.studio',
		...(data.telephone && { telephone: data.telephone }),
		...(data.address && {
			address: {
				'@type': 'PostalAddress',
				...(data.address.streetAddress && { streetAddress: data.address.streetAddress }),
				addressLocality: data.address.addressLocality,
				addressRegion: data.address.addressRegion,
				postalCode: data.address.postalCode,
				addressCountry: data.address.addressCountry ?? 'US',
			},
		}),
		...(data.sameAs && data.sameAs.length > 0 && { sameAs: data.sameAs }),
		...(data.openingHours && { openingHours: data.openingHours }),
		...(data.areaServed &&
			data.areaServed.length > 0 && {
				areaServed: data.areaServed.map((a) => ({ '@type': 'AdministrativeArea', name: a })),
			}),
		...(data.makesOffer &&
			data.makesOffer.length > 0 && {
				makesOffer: data.makesOffer.map((s) => ({
					'@type': 'Offer',
					itemOffered: { '@type': 'Service', name: s },
				})),
			}),
		...(data.ogImage?.asset?.url && { image: data.ogImage.asset.url }),
	};

	// JSON.stringify is the JSON-LD injection mitigation (PATTERNS Threat T-02-01-01):
	// any `</script>` substring inside Sanity strings is escaped to `<\/script>` automatically
	// by JSON serialization, so it cannot break out of the <script type="application/ld+json"> block.
	return (
		<Helmet>
			<script type="application/ld+json">{JSON.stringify(ld)}</script>
		</Helmet>
	);
};

export default JsonLdLocalBusiness;
