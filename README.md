# Pinterest scraper for Localnet

Reads Pinterest pages (`pinterest.com`, and a country's, `ar.pinterest.com`) for Localnet, a browser extension that is
a personal search engine. Localnet pulls it from here the first time it scrapes such a page, through the
[localnet-scrapers](https://github.com/opowell/localnet-scrapers) scraper source.

- `source.json`: what Localnet reads to know the scraper: its name, the URLs it reads, how the site is searched, and the file to run.
- `pinterest.js`: the parser. It is injected into the scraped page after Localnet's DOM helpers (content-scripts/utils/dom.js) and defines `window.__dynamicParser`.
- `pinterest.test.ts`: its unit tests, run from a Localnet checkout (`pnpm parsers pull`, then `pnpm test parsers/localnet-scraper-pinterest`).
- `saved-pages/` (not in git): real pages saved from the site, which Localnet's `e2e/saved-pages.test.ts` scrapes. See Localnet's README.
  Pinterest's pages are drawn by scripts, so they are saved from a browser (`pnpm saved-pages snippet`).

## What it reads

Pinterest's class names are generated; the scraper reads its `data-test-id` hooks.

- A pin (`/pin/651192427418669936/`) reads as its title, headed by who saved it, its picture at full size
  (`/originals/` in place of `/736x/`) and its description where it has one. Its details are its creator, reactions
  and the site it was saved from. It links with weight 1 to that site's page, with 0.5 to its creator's profile, and
  with `0.3 / (1 + rank / 10)` to the pins shown beside it.
- Any other page (a board, a search, `/search/pins/?q=…`, a profile, an idea, `/ideas/art/961238559656/`) is a listing
  of the pins it shows, or, where it shows none (the ideas' index), of the ideas it links to. Pins are listed by their
  address on pinterest.com, whatever country's site the page is on. The page draws them with scripts, so they are
  waited for, up to 5 seconds.
