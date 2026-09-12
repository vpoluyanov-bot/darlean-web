# Presentation assets, kept for later

Source material for `/for-business-owners`, from `Darlean-presentation.zip`.

Nothing here is referenced by the page yet: the mockups ship as placeholders
until the real animations replace them. These files are kept so that work does
not start by hunting for the archive again.

| File | What it is |
|---|---|
| `app-janymda.jpg`, `app-jazzcash.jpg`, `app-toto.jpg`, `app-h.jpg`, `app-star.jpg`, `app-aura.jpg` | App icons on the phone home screen in sections 3, 10 and 11 |
| `home.svg` | Phone home screen, section 9 |
| `task-agent.svg`, `report-agent.svg` | Agent avatars in the meeting window, section 6 |

The three SVGs are not vector art: each wraps a base64 PNG (up to 1122x1402),
which is why `report-agent.svg` is 5 MB and `task-agent.svg` 2.6 MB. Re-encode
them the way `scripts/encode-media.mjs` handles the rest of the media before
putting any of them on a page.
