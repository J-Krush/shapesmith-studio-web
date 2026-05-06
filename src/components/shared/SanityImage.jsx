import { urlFor } from '../../utilities/sanityImage';
import Placeholder from './Placeholder';

const DEFAULT_WIDTHS = [400, 800, 1200, 1600];

const SanityImage = ({
	source,
	alt,
	sizes = '(max-width: 768px) 100vw, 50vw',
	loading = 'lazy', // 'eager' for hero LCP
	className = '',
	placeholderCaption,
}) => {
	// CNT-04 / D-18: alt fallback chain — prop > source.altText > asset.altText > ''.
	// Empty string IS allowed as final fallback (HTML semantic for decorative);
	// consumers should pass `alt` when content-bearing.
	const altText = alt ?? source?.altText ?? source?.asset?.altText ?? '';

	if (!source?.asset) {
		return <Placeholder caption={placeholderCaption} className={className} />;
	}

	const srcSet = DEFAULT_WIDTHS
		.map((w) => `${urlFor(source).width(w).auto('format').quality(80).url()} ${w}w`)
		.join(', ');
	const fallbackSrc = urlFor(source).width(800).auto('format').quality(80).url();

	return (
		<img
			src={fallbackSrc}
			srcSet={srcSet}
			sizes={sizes}
			alt={altText}
			loading={loading}
			className={className}
		/>
	);
};

export default SanityImage;
