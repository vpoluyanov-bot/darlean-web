/**
 * The two addresses the site sends people to: the signup app and the inbox.
 *
 * This is the only place either appears. Nothing else in the project may
 * hard-code them — components ask for a link through `signupHref` or
 * `contactHref`, and the attribution script recognises outgoing signup links
 * by `SIGNUP_HOST`.
 */

export const SIGNUP_URL = 'https://app.darlean.com/signup';

/** The host the attribution script decorates. Derived, never typed twice. */
export const SIGNUP_HOST = new URL(SIGNUP_URL).hostname;

/**
 * Builds a signup link that records where the click came from.
 *
 * `cta` names the page and the block on it, lowercase and underscored:
 * `home_hero`, `pricing_pro`, `header`. It is deliberately separate from the
 * advertising parameters — it says which button was pressed, not which
 * campaign brought the visitor, and the two never overwrite each other.
 */
export function signupHref(cta: string): string {
  const url = new URL(SIGNUP_URL);
  url.searchParams.set('cta', cta);
  return url.toString();
}

/* ---- analytics ---------------------------------------------------------- */

/**
 * Measurement IDs. They live here rather than in the markup so there is one
 * place to look, and each can be overridden per environment without a code
 * change — set PUBLIC_GA4_ID or PUBLIC_GTM_ID in the environment (see
 * .env.example) and a staging build reports somewhere else.
 *
 * Set either to an empty string to leave that tag out of the build entirely.
 */
export const GA4_ID = import.meta.env.PUBLIC_GA4_ID ?? 'G-P04TEGPQQ1';
export const GTM_ID = import.meta.env.PUBLIC_GTM_ID ?? 'GTM-5L6MW4QX';

/** Where enquiries go when a button opens a mail client instead of the app. */
export const CONTACT_EMAIL = 'info@darlean.com';

/**
 * Builds a mail link with a prefilled subject.
 *
 * Each button carries its own subject so the inbox shows which page and which
 * block the person wrote from — the same job `cta` does for signup links, done
 * the only way a mail client allows. These links never carry campaign
 * parameters: the attribution script only touches links pointing at the signup
 * host, and a mailto has no host at all.
 */
export function contactHref(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
