import { afterEach, describe, expect, it } from 'vitest'
import { parserLoader, resetPage, visit } from '#scraper-test'

// The parser, evaluated with the helpers it is injected with, as a scrape runs it.
const load = parserLoader(__dirname)

afterEach(resetPage)

describe('pinterest', () => {
  it('reads a pin\'s picture at full size, its creator and the site it was saved from', async () => {
    const { parsePinterest } = load('pinterest.js', ['parsePinterest'])
    visit('https://ar.pinterest.com/pin/651192427418669936/', `
      <h1 data-test-id="closeup-title">Watercolour</h1>
      <div data-test-id="closeup-body-image-container"><img src="https://i.pinimg.com/736x/e1/78/x.jpg"></div>
      <div data-test-id="closeup-image-overlay-layer-domain-link-button"><a href="https://example.com/post">example.com</a></div>
      <a data-test-id="creator-profile-link" href="/yegorova2411/"><span data-test-id="creator-profile-name">Katrin Kan</span></a>
      <span data-test-id="reactions-count">6</span>
      <div data-test-id="relatedPins"><a href="/pin/370913719338557933/">Other</a></div>`)
    expect(await parsePinterest()).toEqual({
      title: 'Watercolour',
      content: [
        '<post author="Katrin Kan" author-url="https://www.pinterest.com/yegorova2411/">',
        '![Watercolour](https://i.pinimg.com/originals/e1/78/x.jpg)',
      ],
      links: [
        { url: 'https://example.com/post', score: 1 },
        { url: 'https://www.pinterest.com/yegorova2411/', title: 'Katrin Kan', score: 0.5 },
        { url: 'https://www.pinterest.com/pin/370913719338557933/', score: 0.3 },
      ],
      details: [
        ['creator', { text: 'Katrin Kan', url: 'https://www.pinterest.com/yegorova2411/' }],
        ['reactions', 6],
        ['source', 'example.com'],
      ],
    })
  })

  it('reads a board as a listing of its pins, by their address on pinterest.com', async () => {
    const { parsePinterest } = load('pinterest.js', ['parsePinterest'])
    visit('https://de.pinterest.com/someone/art/', '<a href="/pin/1/?mt=login">A</a><a href="https://de.pinterest.com/pin/2/">B</a>')
    expect(await parsePinterest()).toEqual({ listing: true, links: [
      { url: 'https://www.pinterest.com/pin/1/', score: 1 },
      { url: 'https://www.pinterest.com/pin/2/', score: 1 / 1.1 },
    ] })
  })
})
