/**
 * Where the site sends people to sign up.
 *
 * This is the only place the address appears. Nothing else in the project may
 * hard-code it — components ask for a link through `signupHref`, and the
 * attribution script recognises outgoing links by `SIGNUP_HOST`.
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
