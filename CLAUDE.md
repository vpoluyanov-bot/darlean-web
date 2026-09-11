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
`src/components/Button.astro`. Do not reproduce its CSS anywhere else.

## Commands

- `npm run dev` — local server
- `npm run build` — static build into `dist/`
- `npm run fonts` — re-download the self-hosted Inter subsets

## Fonts

Inter is self-hosted from `public/fonts/` (variable, weights 400–600, latin and
cyrillic subsets). Nothing is loaded from a CDN. The latin subset is preloaded
in `BaseLayout.astro`.
