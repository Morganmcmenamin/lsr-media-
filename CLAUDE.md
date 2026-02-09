# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LSR Media is a static marketing website for a real estate media company based in Wellington, New Zealand. The business offers photography, drone/aerial, video, virtual tours, and floor plans for residential properties, plus additional commercial services (graphic design, signage, booklets).

## Architecture

This is a **plain HTML/CSS/JS site** with no build tools, bundlers, or frameworks. To preview, open any `.html` file directly in a browser or use a local server (`python3 -m http.server`).

### Pages

- `index.html` — Homepage with hero video, service cards, trusted-by carousel
- `services.html` — Residential/Commercial tab toggle (sticky tabs, `data-tab`/`data-services` attributes, JS in `main.js`)
- `portfolio.html` — Filterable image gallery with lightbox (`data-category`/`data-filter` attributes)
- `about.html` — Mission statement + team bios
- `book.html` — Residential booking flow: service selection cards, bundle pricing, form submission redirects to Cal.com
- `quote.html` — Commercial quote form, submits via FormSubmit.co to email

### JavaScript

- `js/main.js` — Shared across all pages. Handles: sticky header, mobile hamburger menu, scroll-based fade-in animations (IntersectionObserver), portfolio filtering/lightbox, services page tab switching, quote page URL param pre-selection.
- `js/booking.js` — Only loaded on `book.html`. Handles: service selection state, bundle pricing calculation from a lookup table (`bundlePrices`), large property surcharge (+$50), sticky cart bar, form validation, and Cal.com redirect URL construction with pre-filled parameters.

### CSS

- `css/style.css` — Single stylesheet. Uses CSS custom properties (`:root` variables) for colors, spacing, and typography. Dark theme (black/dark-gray background, white text, red `#E53935` accent). Font: Inter via Google Fonts. Responsive breakpoints at 1024px, 768px, 480px.

### Key Patterns

- **Header/footer are duplicated** in every HTML file (no templating). Changes to nav or footer must be applied to all 6 pages.
- **Residential vs Commercial** services are split via `data-services="residential"` / `data-services="commercial"` containers on `services.html`, toggled by `property-tab-btn` buttons.
- **Residential booking** uses fixed prices with a bundle discount lookup table in `booking.js`. Commercial services use "Get a Quote" / "From $X" pricing and link to `quote.html`.
- **Service deep-linking**: `book.html?service=aerial` pre-selects a service. `quote.html?service=commercial-photography` pre-checks the corresponding checkbox.
- **Animations**: Elements with class `fade-in` animate in via IntersectionObserver adding class `visible`. Staggered delays via `fade-in-delay-1/2/3`.
- **Form submissions**: `book.html` redirects to Cal.com with query params. `quote.html` POSTs to FormSubmit.co.

### Assets

- `assets/images/logo.png` — Site logo
- `assets/video/hero-video.mp4` — Homepage hero background video
- `assets/portfolio/` — Portfolio gallery images
- Other `assets/*.jpg` / `*.png` — Service detail images, hero backgrounds, team photos

## CSS Variables (Brand)

```
--color-red: #E53935 (primary accent)
--color-black: #000000 (page background)
--color-dark-gray: #1A1A1A (card/section backgrounds)
--color-gray: #333333
--color-light-gray: #888888 (secondary text)
--color-border: #2A2A2A
--font-primary: 'Inter'
```
