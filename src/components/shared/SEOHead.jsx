import { Helmet } from 'react-helmet-async';

// Per-route SEO meta wrapper (D-19).
// Static routes (/, /about, /contact, /shop, /404) pass hardcoded props.
// Sanity-driven routes (/styles, /styles/:slug, /3d-printing, /3d-printing/:slug)
// pass props sourced from the Sanity seo block (Plan 04 wires those).
const SEOHead = ({
	title,
	description,
	ogImage, // { url, altText }
	ogUrl,
	noindex = false,
}) => {
	const fullTitle = title ? `${title} — Shapesmith Studio` : 'Shapesmith Studio';
	return (
		<Helmet>
			<title>{fullTitle}</title>
			{description && <meta name="description" content={description} />}
			<meta property="og:title" content={fullTitle} />
			{description && <meta property="og:description" content={description} />}
			{ogImage?.url && <meta property="og:image" content={ogImage.url} />}
			{ogImage?.altText && <meta property="og:image:alt" content={ogImage.altText} />}
			{ogUrl && <meta property="og:url" content={ogUrl} />}
			<meta property="og:type" content="website" />
			{noindex && <meta name="robots" content="noindex" />}
		</Helmet>
	);
};

export default SEOHead;
