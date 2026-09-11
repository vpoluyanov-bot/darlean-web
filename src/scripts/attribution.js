/**
 * Carries campaign attribution through to the signup app.
 *
 * On the first page of a session it records the advertising parameters, the
 * referrer and the landing page. On every page it writes whatever it holds
 * into the href of each link pointing at the signup host — at load, not on
 * click, so the parameters survive "open in new tab" and copying the link.
 *
 * First touch wins: once a session has a record, later pages never overwrite
 * it. That is what stops an internal click-through — which carries no
 * parameters of its own — from erasing the campaign that brought the visitor.
 *
 * No dependencies, and it runs as a module, so it never blocks rendering.
 */
import { SIGNUP_HOST } from '../config';

const STORAGE_KEY = 'darlean:attribution';

/** Advertising parameters, read from the address as they are. */
const CAMPAIGN_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'yclid',
];

/** Session storage is unavailable in some privacy modes; never let that throw. */
function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(record) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* Nothing to do — the page still works, the link just carries less. */
  }
}

/** Reads this page's address, keeping only parameters that are actually set. */
function readFromUrl() {
  const params = new URL(window.location.href).searchParams;
  const found = {};

  for (const name of CAMPAIGN_PARAMS) {
    const value = params.get(name);
    if (value) found[name] = value;
  }

  return found;
}

function capture() {
  const existing = readStored();
  if (existing) return existing;

  const record = readFromUrl();

  // Where they came from and where they landed, kept alongside the campaign.
  if (document.referrer) record.dl_referrer = document.referrer;
  record.dl_landing = window.location.href;

  writeStored(record);
  return record;
}

/**
 * Adds the stored parameters to one link without disturbing what it already
 * carries — its own `cta`, or any parameter written into the markup.
 */
function decorate(link, record) {
  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return;
  }

  if (url.hostname !== SIGNUP_HOST) return;

  for (const [name, value] of Object.entries(record)) {
    if (!value || url.searchParams.has(name)) continue;
    url.searchParams.set(name, value);
  }

  link.href = url.toString();
}

function decorateAll() {
  const record = capture();
  for (const link of document.querySelectorAll('a[href]')) decorate(link, record);
}

decorateAll();

// A page restored from the back/forward cache keeps its old hrefs; re-apply.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) decorateAll();
});
