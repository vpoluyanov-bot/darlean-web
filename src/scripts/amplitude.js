/**
 * Loads Amplitude and ties this visit to the session that follows in the app.
 *
 * Same setup as the Tasks landing: page views and campaign attribution only,
 * no custom events. The SDK is fetched once the browser is idle, so it never
 * competes with the first screen.
 *
 * Two things carry the visitor across to the app. The SDK's cookie is set on
 * the shared top-level domain, which app.darlean.com can read; and once the
 * SDK knows its device id, every signup link gets it as `ampDeviceId`, which
 * covers the cases a cookie cannot — another browser, a copied link.
 *
 * Analytics must never break the page, so every step swallows its errors.
 */
import { AMPLITUDE_KEY, SIGNUP_HOST } from '../config';

const SDK_URL = 'https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz';

/** `.darlean.com`, derived from the signup host rather than typed again. */
const SHARED_DOMAIN = '.' + SIGNUP_HOST.split('.').slice(-2).join('.');

/**
 * The shared cookie domain, but only on a host that belongs to it. On the
 * Vercel preview or localhost the browser would reject the cookie outright,
 * so there the SDK falls back to its own host.
 */
function cookieDomain() {
  const host = '.' + window.location.hostname;
  return host.endsWith(SHARED_DOMAIN) ? SHARED_DOMAIN : undefined;
}

/** Adds the device id to signup links, never replacing one already there. */
function decorate() {
  let deviceId;
  try {
    deviceId = window.amplitude?.getDeviceId?.();
  } catch {
    return;
  }
  if (!deviceId) return;

  for (const link of document.querySelectorAll('a[href]')) {
    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      continue;
    }
    if (url.hostname !== SIGNUP_HOST || url.searchParams.has('ampDeviceId')) continue;
    url.searchParams.set('ampDeviceId', deviceId);
    link.href = url.toString();
  }
}

function load() {
  const script = document.createElement('script');
  script.async = true;
  script.src = SDK_URL;
  script.onload = () => {
    if (!window.amplitude) return;
    try {
      const domain = cookieDomain();
      const started = window.amplitude.init(AMPLITUDE_KEY, undefined, {
        autocapture: { elementInteractions: false },
        defaultTracking: { attribution: true, pageViews: true },
        ...(domain ? { cookieOptions: { domain } } : {}),
      });
      // init is asynchronous: the device id exists only once it resolves.
      Promise.resolve(started?.promise).then(decorate, () => {});
    } catch {
      /* Nothing to do — the page works without it. */
    }
  };
  document.head.appendChild(script);
}

if (AMPLITUDE_KEY) {
  const whenIdle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 2000));
  whenIdle(load, { timeout: 4000 });

  // A page restored from the back/forward cache keeps its old hrefs; re-apply.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) decorate();
  });
}
