# dar-web

Static marketing site for Darlean. Astro + Tailwind, no runtime JS framework.

## Rules

**Tokens are the only source of truth.** `src/styles/tokens/*.css` is copied
verbatim from the Darlean Dark design system. Never write a raw colour, size,
radius or duration in markup — add or change the token upstream, then expose it
in `tailwind.config.mjs` as `var(--token)`.

**Copy lives in `src/i18n/<locale>.json`,** never inline in components. Russian
is planned, so any string a visitor reads goes through `t(locale)`. The
styleguide page is the one exception: it is an internal tool and ships in one
language.

**Accessibility.** `--text-tertiary` fails WCAG AA for body text on every
surface (4.14:1 on page, 3.32:1 on card). Use it only for text 24px and larger,
or for decoration. It must never carry meaning on `--surface-elevated`, where it
fails at every size. `--accent-deep` has the same limitation — treat it as a
background colour, not a text colour. `/styleguide` recomputes these numbers on
every build.

**The gradient button is a documented exception** to the design system's "no
shadows anywhere" rule, specified by the brand brief. It lives entirely in
`src/components/Button.astro`. Do not reproduce its CSS anywhere else. Its
gradient was darkened from the brief's stops so white label text clears 4.5:1 at
every frame — the animation drags every stop under the label, so the brightest
stop is the one that has to pass. #0370A7 is the ceiling; do not lighten it
without re-checking the contrast.

**Site token extensions.** The homepage uses colours, radii and widths the
design system does not define (light sections, per-agent hues, the 1280px
content width). They live in `src/styles/tokens/site.css`, clearly separated
from the design-system files, and are listed on `/styleguide` under "Project
extensions". Add new ones there rather than inline in markup.

**Media is generated, not hand-managed.** `npm run media -- "<export path>"`
rebuilds everything in `public/media` from the Claude Design export. Every clip
ships as AV1/WebM with an H.264/MP4 fallback and a WebP poster; portraits ship
as WebP with a PNG fallback. Resolutions are twice what the element occupies at
1440px wide — the encode script records the display size next to each entry, so
adjust it there if a layout changes rather than re-encoding by hand.

**Nothing but the hero loads at first paint.** Clips outside the hero keep their
URLs in `data-src` until an IntersectionObserver in `src/scripts/homepage.js`
moves them onto the element, two screens ahead of arrival. Adding a video means
adding `data-lazy-video` and `data-src`, not a bare `src`.

**Analytics is declared once, in the layout.** GA4 and Tag Manager are rendered
by `BaseLayout.astro`, so every page gets them and no page can be missed. The
measurement IDs live in `src/config.ts` with a `PUBLIC_GA4_ID` / `PUBLIC_GTM_ID`
environment override; setting either to an empty string drops that tag from the
build. The snippets are `is:inline` on purpose — Astro must not bundle them, or
they stop being the code Google publishes.

**The signup address lives in `src/config.ts` and nowhere else.** Components ask
for a link with `signupHref('<page>_<block>')`; the `cta` value names the page
and the block that was clicked, lowercase and underscored. `src/scripts/
attribution.js` recognises outgoing links by the host derived from the same
constant, so changing the address is a one-line edit.

**Attribution is first touch, written into hrefs at load.** The script records
the campaign parameters, referrer and landing page once per session and never
overwrites them, so an internal click-through cannot erase the campaign that
brought the visitor. It writes the stored values into every signup link's href
on load rather than on click, which is what keeps them intact when a link is
opened in a new tab or copied. Parameters a link already carries — its `cta`
included — are never replaced.

**The AI section's height is derived, not chosen.** `src/lib/ai-timeline.js`
lists the steps of the pinned sequence in beats; the component reads it to set
the section height and the script reads it to drive the animation, so the two
can never drift apart. The steps are laid end to end, which is what keeps the
scroll free of stretches where nothing moves. `BEAT_VH` is the knob: raise it to
slow the whole sequence evenly, never by editing a single step's numbers.

**The sphere is a video, not a Lottie.** The file it was drawn as is 300 base64
PNG frames — 3.1 MB gzipped for a 160px decoration — so it is re-encoded as the
ten-second loop it actually is (84 KB) by `npm run media`. No player is
vendored. Do not reintroduce the JSON.

**The header hides on the way down and returns on the way up.** State lives in
two attributes on the `<nav>`: `data-stuck` turns the glass on once the bar
overlaps content, `data-hidden` slides it away. Both are set by the script in
`Nav.astro`, which ignores scroll movements under 8px and never hides the bar
before 160px, so it does not twitch. Under reduced motion it stays put. It is
`position: sticky`, not `fixed`, which is why the two pinned sections still pin
at the top of the viewport underneath it — verified, do not switch it to fixed
without rechecking them.

**The design system defines no mobile navigation.** Its Navbar is a single
desktop row with no collapse, and there is no drawer or menu component. Below
`sm` the links take a second line inside the same bar rather than hiding behind
a hamburger: with two of them, a menu would cost a tap to reveal what already
fits on screen.

**The header links sit with the CTA, not with the logo.** The design system's
Navbar trails them off the logo; ours groups them right, which is a deliberate
departure. Gaps are on the scale — `--space-6` between links, `--space-8`
before the button — so the button stays visibly apart from them.

**The two pinned sequences are desktop-only.** Above `md` the AI section and the
by-role deck pin their contents and let scroll position play them. Below it
there is no pinning: the AI section is a plain vertical story and the deck is a
native snap carousel swiped by finger. The markup carries the mobile layout
unprefixed and restores the pinned one under `md:`, and `src/scripts/homepage.js`
checks the same breakpoint before touching anything — a stale inline style from
a wider window would otherwise hide content that is meant to be simply visible.

**Mobile is checked, not guessed.** `npm run audit:mobile` walks every page at
375, 390 and 430px, reports elements that push the page sideways or spill out of
their box, and writes a screen-by-screen set of screenshots into `.audit/`. Run
it after any layout change. The desktop layout is the baseline: mobile fixes go
in as the unprefixed value with `md:` restoring the desktop behaviour, never by
editing the desktop rule.

**`/for-business-owners` is a ported presentation, not a site page.** It wears
the site's own `Nav` and `Footer`, unchanged, but it is deliberately absent
from the header's links: the way in is the "For business owners" card in the
roles carousel on the home page, and the header is there so a visitor can
leave. The original deck's scroll-snap slides and its chain of timers are not
ported — sections are sized by content and fade in once, on arrival, through
`src/components/owners/Reveal.astro`.

Every scene that happens at an hour carries that hour behind its copy, set
enormous and clipped by the section: `src/components/owners/GhostHour.astro`,
aligned to the copy it sits behind. It is the page's one recurring device, so
it lives in one component rather than being reproduced per scene.

The opening scene runs `owners-hero` behind it. The clip is decoration —
silent, looping, no controls, hidden from assistive technology — and nothing is
fetched for it until the page's own load event has fired, so it can never
compete with the first screen. Under reduced motion it is never fetched at all
and the poster frame is the backdrop. The scrim over it is sized by
measurement, not taste: the footage peaks at rgb(39,83,134), which would drop
the lead paragraph to 2.1:1, and 65% of `--surface-page` over it takes the
worst text pixel on the scene back to 4.8:1. Lighten that number and the
contrast goes with it.

Its mockups ship as placeholders: `MockPlaceholder.astro` keeps each one's
original aspect ratio and width and says what belonged there. The source
material sits unused in `public/media/owners/` — see the README there before
putting any of it on a page.

## Hosting

Vercel, connected to this repository. **A push to `main` is a deployment** —
Vercel builds the commit and publishes it to Production without anything in the
repo describing it: there is no `vercel.json`, no workflow file, and no GitHub
Action. The only trace on the GitHub side is the deployment list. Treat pushing
to `main` as going live, not as saving work.

- Preview address: `darlean-web.vercel.app`
- Domain: `darlean.com` is being connected. `www.darlean.com` will be the
  canonical address, with the bare domain redirecting to it.

`astro.config.mjs` holds the canonical host as `site`. Canonical tags, the
sitemap and `robots.txt` are all built from it, so the host is written once.

`src/pages/sitemap.xml.ts` and `src/pages/robots.txt.ts` generate their files
from the pages that exist, discovered by `src/lib/routes.ts` — a new page is
listed the moment it is added. Pages that are internal tooling go in that
file's `INTERNAL` list, which keeps them out of the sitemap and disallows them
in `robots.txt`; give them `noindex` on the layout too, the way `/styleguide`
does.

Open Graph and Twitter Card tags are rendered by the layout from the same
title and description each page already declares. The card image is generated,
not drawn: `node scripts/make-og.mjs` renders `public/og.png` at 1200x630 from
the token files and the self-hosted Inter, so it follows the design system.

Structured data lives in `src/lib/structured-data.ts` and is built from the
copy file, never retyped — prices in the JSON-LD come from the same plans the
pricing page renders, so the markup cannot describe a product the page does
not. Organization, WebSite and SoftwareApplication are on every page; the
homepage adds FAQPage, pricing adds Product.

`/llms.txt` is generated the same way, from the copy and the route list.

**Legal pages are data, not markup.** The three documents live as block models
under `legal` in the copy file — headings, paragraphs, lists and tables —
rendered by `src/components/LegalDocument.astro`. `scripts/import-legal.py`
converts a page exported from Claude Design into that shape, dropping every
inline style the comp hardcoded. They are indexable and carry canonical tags,
but sit in `UNLISTED` in `src/lib/routes.ts` so they stay out of the sitemap:
public for people who go looking, not pages we ask to have ranked.

**Measure on a build, never on the dev server.** A stray `astro dev` on the
same port once made Lighthouse report Performance 56 with an 8.9s first paint;
the same commit measured 100 through `astro preview`. The dev server ships
unminified modules and the Astro toolbar, so its numbers mean nothing.

## Open questions

Not bugs to fix in passing — each needs a decision or a lawyer before the code
changes. Recorded so they are not rediscovered from scratch.

**1. A link in the cookie policy reads "here".** In section 1: "The Privacy
Statement of DARLEAN US can be accessed here." It should read "can be accessed
in the Privacy Statement", which makes the link text describe its target. This
is the one thing keeping `/cookie-policy` at SEO 92 rather than 100. An
`aria-label` was tried and reverted: an accessible name that omits the visible
word fails WCAG 2.5.3, so the wording itself has to change — and it is legal
copy. The text lives under `legal.cookiePolicy.document` in the copy file.

**2. The cookie policy describes tools the site does not use. Blocks European
traffic.** It lists HubSpot and Matomo; the site actually runs Google Analytics
4 and Google Tag Manager, which the document never mentions. The privacy policy
names Google Tag Manager in 8.4 but not GA4. So the document does not describe
the processing that actually happens, and both tags fire unconditionally with
no consent banner and no Consent Mode. Legal need to supply: which analytics
run, which cookies each sets, who the processor is, retention periods and the
legal basis. Until then the site should not be pointed at EU or UK visitors.

**3. Three different legal entities and two support addresses. Blocks European
traffic.** The user agreement is issued by DAR TECH Limited (Nicosia, Cyprus);
the privacy and cookie policies by DARLEAN US CORP. (Dover, Delaware); the
footer says DAR TECH CY. Data-protection enquiries go to `support@darlean.com`
in the documents, while the site's own buttons write to `info@darlean.com`
(`CONTACT_EMAIL` in `src/config.ts`). This may be deliberate — different
entities for different markets — but a visitor cannot tell who the controller
is, which is exactly what a European visitor is entitled to know. Needs to be
reconciled with legal before EU traffic.

**4. The footer's right-hand block is removed, temporarily.** It held the
LinkedIn icon, "DAR TECH CY ©2024" and "All rights reserved.", along with the
`linkedin`, `copyright` and `rights` keys under `footer` in the copy file — all
taken out of `Footer.astro` in the same commit, so restoring means putting the
copy back too.

It comes back once legal confirm the entity and the copyright year, which is
the same reconciliation as (3), and once there is a LinkedIn page worth linking:
the current one is `darlean-erp`, and the positioning has moved on.

While deciding, note that `ORG.linkedin` in `src/lib/routes.ts` still feeds
`sameAs` in the Organization schema on every page, so the site keeps
advertising a LinkedIn profile in its structured data even with the footer icon
gone. That was left alone deliberately rather than changed on the way past —
it should be settled together with the footer, not separately.

## Commands

- `npm run dev` — local server
- `npm run build` — static build into `dist/`
- `npm run fonts` — re-download the self-hosted Inter subsets
- `npm run audit:mobile` — check every page at phone widths

## Fonts

Inter is self-hosted from `public/fonts/` (variable, weights 400–600, latin and
cyrillic subsets). Nothing is loaded from a CDN. The latin subset is preloaded
in `BaseLayout.astro`.
