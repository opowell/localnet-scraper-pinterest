// A pin's address on pinterest.com, whatever country's site links to it: https://www.pinterest.com/pin/651192427418669936/.
function pinterestPin(href) {
  const id = /\/pin\/(\d+)/.exec(new URL(href, location.href).pathname)?.[1]
  return id ? `https://www.pinterest.com/pin/${id}/` : null
}

// The element of this data-test-id.
function pinterestPart(id) {
  return document.querySelector(`[data-test-id="${id}"]`)
}

// A pin (/pin/651192427418669936/) reads as its title, its picture at full size, its description where it has one, and
// who saved it as its author. Its details are its creator, reactions and the site it was saved from. It links with
// weight 1 to that site's page, with 0.5 to its creator's profile, and with 0.3 / (1 + rank / 10) to the pins shown
// beside it.
async function pinterestPinPage() {
  await waitFor(() => pinterestPart('closeup-body-image-container')?.querySelector('img') || pinterestPart('closeup-title'), 5000)
  const title = pinterestPart('closeup-title')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || document.title
  const img = pinterestPart('closeup-body-image-container')?.querySelector('img')
  const picture = img?.src && img.src.replace(/\/\d+x\//, '/originals/')
  const description = Array.from(document.querySelectorAll('[data-test-id="truncated-description"], [data-test-id="richPinInformation-description"], [data-test-id="closeup-description-container"] [data-test-id="text"]'), element => element.innerText.trim())
    .filter(text => text && text !== title)
  const creatorLink = pinterestPart('creator-profile-link') || pinterestPart('creator-avatar-link')
  const creator = pinterestPart('creator-profile-name')?.innerText.trim()
  const creatorUrl = creatorLink && new URL(creatorLink.getAttribute('href'), 'https://www.pinterest.com').href
  const source = Array.from(document.querySelectorAll('[data-test-id="closeup-image-overlay-layer-domain-link-button"] a, [data-test-id="image-link"]'))
    .map(a => a.href).find(href => href && !/(^|\.)pinterest\./.test(new URL(href).hostname))
  const reactions = Number.parseInt((pinterestPart('reactions-count')?.innerText || '').replace(/[^\d]/g, ''), 10)
  const here = pinterestPin(location.href)
  const related = [...new Set(linkUrls('[data-test-id="relatedPins"] a[href*="/pin/"]').map(pinterestPin))].filter(url => url && url !== here)
  return {
    title,
    content: [
      ...(creator ? [postBlock({ authors: [{ name: creator, url: creatorUrl }] })] : []),
      ...(picture ? [`![${title}](${picture})`] : []),
      ...[...new Set(description)],
    ],
    links: [
      ...(source ? [{ url: source, score: 1 }] : []),
      ...(creatorUrl ? [{ url: creatorUrl, title: creator, score: 0.5 }] : []),
      ...related.map((url, rank) => ({ url, score: 0.3 / (1 + rank / 10) })),
    ],
    details: [
      ['creator', creator ? { text: creator, url: creatorUrl } : null],
      ['reactions', Number.isNaN(reactions) ? null : reactions],
      ['source', source ? new URL(source).hostname.replace(/^www\./, '') : null],
    ],
  }
}

// A page of Pinterest (any country's site): a pin (see pinterestPinPage); any other page (a board, a search,
// /search/pins/?q=…, a profile, an idea, /ideas/art/961238559656/) is a listing of the pins it shows, each by its
// address on pinterest.com, or, where it shows none (the ideas' index), of the ideas and boards it links to. The page
// draws them with scripts, so they are waited for, up to 5 seconds.
async function parsePinterest(_profileId) {
  if (!/(?:^|\.)pinterest\.[a-z.]+$/.test(location.hostname)) {
    return null
  }
  if (/^\/pin\/\d+/.test(location.pathname)) {
    return pinterestPinPage()
  }
  await waitFor(() => document.querySelector('a[href*="/pin/"]'), 5000)
  const pins = linkUrls('a[href*="/pin/"]').map(pinterestPin)
  if (pins.some(Boolean)) {
    return listingOf(pins)
  }
  return listingOf(linkUrls('a[href*="/ideas/"]').map(url => url.split(/[?#]/)[0])) ?? { listing: true }
}

// The parser a scrape calls.
registerParser(parsePinterest)
