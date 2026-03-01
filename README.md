# Kwartier West Website

Production-grade frontend for Kwartier West.

## Core goals
- Two artist lanes: Tekno and Hip hop.
- Booking flow for single artist, multiple artists, side collective, full label takeover.
- Event hub with official social source references.
- Shared storefront for Kwartier West merch + artist merch.
- Data contracts prepared for future app/webhook integration.
- International UX: language detection + persistent language switch across pages.

## Routes
- `/index.html`
- `/pages/tekno/index.html`
- `/pages/hiphop/index.html`
- `/pages/events/index.html`
- `/pages/booking/index.html`
- `/pages/shop/index.html`
- `/pages/partners/index.html`
- `/pages/contact/index.html`
- `/pages/manifest/index.html`

## Data contracts
- `data/artists.json`
- `data/events.json`
- `data/shop.json`
- `data/partners.json`
- `data/integrations.json`

## Commands
- `npm run dev`
- `npm run validate`
- `npm run lint`
- `npm run site-check`
- `npm run check`
- `npm run prepush`

## CI quality gate
- GitHub Actions runs `npm ci` and `npm run check` on every push and pull request targeting `main`.

## Artist profile content contract
- See [`docs/artist-content-contract.md`](docs/artist-content-contract.md) for stable rules on `headline`, `story`, and `bio`.

## Internationalization
- Base language: English.
- Language switch is available globally in the navigation and on the landing page.
- Language preference is saved in local storage and also synced via `?lang=<code>` in the URL.
- Core UI translations are provided for: `en`, `nl`, `fr`, `de`, `es`, `pt`, `it`, `pl`, `ru`, `tr`, `ar`, `zh`.

## Integration handoff
When backend/app is ready, connect:
1. `data/integrations.json.eventSync.endpoint`
2. `data/integrations.json.bookingWebhook.endpoint`
3. `data/integrations.json.shopApi.endpoint`

The frontend already emits structured booking payloads and consumes normalized data contracts.
If `bookingWebhook.enabled=true`, booking submissions are POSTed automatically and still return mail + JSON fallback on failure.
