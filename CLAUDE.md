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

**The AI section's height is derived, not chosen.** `src/lib/ai-timeline.js`
lists the steps of the pinned sequence in beats; the component reads it to set
the section height and the script reads it to drive the animation, so the two
can never drift apart. The steps are laid end to end, which is what keeps the
scroll free of stretches where nothing moves. `BEAT_VH` is the knob: raise it to
slow the whole sequence evenly, never by editing a single step's numbers.

**The Lottie sphere is the open question.** `ai-sphere.json` is 3.1 MB gzipped —
more than every other clip on the page combined — because it is 300 base64 PNG
frames, not vector art. It is lazy-loaded so it costs nothing up front, but as a
160x160 looping video it would be about 84 KB. Raised with the team; not changed
without a decision.

## Commands

- `npm run dev` — local server
- `npm run build` — static build into `dist/`
- `npm run fonts` — re-download the self-hosted Inter subsets

## Fonts

Inter is self-hosted from `public/fonts/` (variable, weights 400–600, latin and
cyrillic subsets). Nothing is loaded from a CDN. The latin subset is preloaded
in `BaseLayout.astro`.
