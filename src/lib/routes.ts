/**
 * Which pages belong in the sitemap.
 *
 * Routes are discovered from the files in src/pages, so a new page is listed
 * the moment it exists — nobody has to remember to add it here. What does need
 * a decision is the opposite: pages that exist for us rather than for readers,
 * which are named below and kept out of both the sitemap and the index.
 */

const PAGES = import.meta.glob('../pages/**/*.astro', { eager: false });

/** Pages that are internal tooling, not part of the public site. */
export const INTERNAL = ['/styleguide'];

/** Turns `../pages/pricing.astro` into `/pricing`, and `index.astro` into `/`. */
function toRoute(file: string): string {
  const path = file
    .replace('../pages/', '')
    .replace(/\.astro$/, '')
    .replace(/\/?index$/, '');

  return '/' + path;
}

/** Every public route, sorted, with the home page first. */
export function publicRoutes(): string[] {
  const routes = Object.keys(PAGES)
    .map(toRoute)
    // A dynamic route would need its params resolved; there are none yet, and
    // silently emitting `/[slug]` into a sitemap would be worse than failing.
    .filter((route) => !route.includes('['))
    .filter((route) => !INTERNAL.includes(route));

  return [...new Set(routes)].sort((a, b) => a.length - b.length || a.localeCompare(b));
}

/** The absolute, canonical form of a route. No trailing slash except the root. */
export function canonical(route: string, site: URL | undefined): string {
  const clean = route !== '/' ? route.replace(/\/$/, '') : '/';
  return new URL(clean, site ?? 'https://www.darlean.com').href;
}
