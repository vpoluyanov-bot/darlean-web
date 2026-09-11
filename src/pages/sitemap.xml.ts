import type { APIRoute } from 'astro';
import { publicRoutes, canonical } from '../lib/routes';

/**
 * The sitemap is generated from the pages that exist, not from a hand-kept
 * list, so it cannot fall behind the site. Internal pages are excluded in
 * src/lib/routes.ts.
 */
export const GET: APIRoute = ({ site }) => {
  const urls = publicRoutes()
    .map((route) => `  <url>\n    <loc>${canonical(route, site)}</loc>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
