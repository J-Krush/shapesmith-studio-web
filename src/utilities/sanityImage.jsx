import imageUrlBuilder from '@sanity/image-url';
import sanityClient from './sanityClient';

const builder = imageUrlBuilder(sanityClient);

// Returns a chain-able builder for a Sanity image source.
// Caller chains .width(N).auto('format').quality(Q).url() to get the URL.
export const urlFor = (source) => builder.image(source);

// One-liner for "give me a default-quality URL at width N".
export const urlAt = (source, width) =>
	urlFor(source).width(width).auto('format').quality(80).url();
