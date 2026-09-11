import type { APIRoute } from 'astro';
import { INTERNAL } from '../lib/routes';

/**
 * Generated rather than kept as a static file so the sitemap URL and the list
 * of internal pages stay tied to the same source as everything else.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap.xml', site ?? 'https://www.darlean.com').href;

  const body = [
    'User-agent: *',
    'Allow: /',
    ...INTERNAL.map((route) => `Disallow: ${route}`),
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
