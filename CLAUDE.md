# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LSR Media is a static marketing website for a real estate media company based in Wellington, New Zealand. Offers photography, drone/aerial, video, virtual tours, and floor plans for residential properties, plus commercial services (graphic design, signage, booklets).

## Development

No build tools, bundlers, or frameworks. Preview with:

```
python3 -m http.server
```

Then open `http://localhost:8000` in a browser.

## Architecture

### Pages (6 HTML files)

- `index.html` — Homepage with hero video, service cards, trusted-by carousel
- `services.html` — Residential/Commercial tab toggle
- `portfolio.html` — Filterable image gallery with lightbox
- `about.html` — Mission statement + team bios
- `book.html` — Residential booking flow + embedded commercial quote form
- `quote.html` — Standalone commercial quote form

### JavaScript

- `js/main.js` — Loaded on all pages. Sticky header, mobile menu, scroll fade-in animations (IntersectionObserver), portfolio filter/lightbox, services tab switching, quote page URL param pre-selection.
- `js/booking.js` — Only on `book.html`. Service selection state, bundle pricing from lookup table (`bundlePrices`), large property surcharge (+$50), sticky cart bar, form validation, Cal.com redirect URL construction.

### CSS

- `css/style.css` (~2050 lines) — Single stylesheet. CSS custom properties for theming. Responsive breakpoints at 1024px, 768px, 480px.

## Critical Patterns

### Header/footer are duplicated in every HTML file

There is no templating. Any change to navigation or footer **must be applied to all 6 pages** manually.

### Two form submission backends

- **Residential booking** (`book.html`): JS builds a URL with query params and redirects to the appropriate `cal.com/lsrmedia/booking-page-{duration}-mins` event type based on selected services
- **Commercial quotes** (`quote.html` and the commercial section of `book.html`): POST to `https://formsubmit.co/morganmcmenamin2@outlook.com`

### Residential vs Commercial split

- `services.html`: `data-services="residential"` / `data-services="commercial"` containers toggled by `.property-tab-btn` buttons with `data-tab` attribute.
- `book.html`: Also has residential/commercial sections — residential uses JS booking flow, commercial uses FormSubmit.co form.

### Bundle pricing

`booking.js` has a flat lookup table (`bundlePrices`) mapping every combination of the 5 residential services (sorted alphabetically, comma-joined) to a bundle price. When adding/changing services, this table must be updated for all combinations.

### Service deep-linking

- `book.html?service=aerial` pre-selects a residential service card
- `quote.html?service=commercial-photography` pre-checks the corresponding checkbox
- `services.html` links use these params to send users to the right booking flow

### Animations

Elements with class `fade-in` animate in via IntersectionObserver adding class `visible`. Stagger with `fade-in-delay-1`, `fade-in-delay-2`, `fade-in-delay-3`.

## CSS Variables (Brand)

```
--color-red: #E53935       (primary accent)
--color-black: #000000     (page background)
--color-dark-gray: #1A1A1A (card/section backgrounds)
--color-gray: #333333
--color-light-gray: #888888 (secondary text)
--color-border: #2A2A2A
--font-primary: 'Inter'
```
