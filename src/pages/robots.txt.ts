import type { APIRoute } from 'astro';
import { INTERNAL } from '../lib/routes';

/**
 * Generated rather than kept as a static file so the sitemap URL and the list
 * of internal pages stay tied to the same source as everything else.
 *
 * The AI crawlers are named explicitly even though the wildcard rule already
 * allows them. Being listed is a decision on the record: someone tightening
 * the wildcard later has to decide about these separately rather than cutting
 * the site out of AI answers by accident.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
];
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap.xml', site ?? 'https://www.darlean.com').href;

  const disallow = INTERNAL.map((route) => `Disallow: ${route}`);

  const body = [
    'User-agent: *',
    'Allow: /',
    ...disallow,
    '',
    '# AI crawlers and assistants are welcome.',
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', ...disallow, '']),
    `Sitemap: ${sitemap}`,
    '',
    `# Plain-language brief for assistants: ${new URL('/llms.txt', site ?? 'https://www.darlean.com').href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
