// Postbuild script — runs automatically after `pnpm build` via npm/pnpm lifecycle hooks.
// Outputs build/sitemap.xml. Static routes are hardcoded; dynamic Sanity slugs are
// queried at build time. Hardcoded projectId/dataset/apiVersion match
// src/utilities/sanityClient.jsx — env-driven config is deferred to Phase 4 Vite
// migration per CONTEXT.md.
//
// Threat T-02-04-02 (XML injection): every URL string passes through escapeXml()
// before landing in the <loc> element. Sanity slugs are typically alphanumeric +
// hyphens, but defensive escaping is one line and prevents future surprise.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

// STATIC_ROUTES: keep in sync with src/App.js when routes are added.
// /materials and /404 are intentionally excluded — one is a redirect (Plan 02-02);
// the other is noindex (Plan 02-04 NotFound.jsx).
const STATIC_ROUTES = ['/', '/styles', '/3d-printing', '/about', '/contact', '/shop', '/quote'];
const BASE_URL = 'https://shapesmith.studio';

// MUST match src/utilities/sanityClient.jsx exactly. T-02-04-04 accepts the hardcoded
// public-knowledge identifiers; Phase 4 Vite migration moves these to env vars.
const client = createClient({
	projectId: 'qx9kep1e',
	dataset: 'production',
	useCdn: true,
	apiVersion: '2023-06-16',
});

const QUERY = `{
	"laserSlugs": *[_type == "laser-style" && defined(slug.current)].slug.current,
	"printSlugs": *[_type == "print-style" && defined(slug.current)].slug.current
}`;

const escapeXml = (s) =>
	String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

(async () => {
	try {
		const { laserSlugs = [], printSlugs = [] } = await client.fetch(QUERY);
		const dynamic = [
			...laserSlugs.map((s) => `/styles/${s}`),
			...printSlugs.map((s) => `/3d-printing/${s}`),
		];
		const today = new Date().toISOString().slice(0, 10);
		const allRoutes = [...STATIC_ROUTES, ...dynamic];
		const urls = allRoutes
			.map((u) => `\t<url><loc>${escapeXml(BASE_URL + u)}</loc><lastmod>${today}</lastmod></url>`)
			.join('\n');
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
		const buildDir = path.join(__dirname, '..', 'build');
		// T-02-04-05: fail loudly rather than silently shipping a stale sitemap.
		if (!fs.existsSync(buildDir)) {
			console.error('build/ directory does not exist. Run `pnpm build` before `pnpm postbuild`.');
			process.exit(1);
		}
		fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), xml);
		console.log(`sitemap.xml written with ${allRoutes.length} URLs`);
	} catch (err) {
		console.error('Sitemap generation failed:', err);
		process.exit(1);
	}
})();
