# menu-translate-tools

Reusable static tooling for turning foreign-language restaurant menus into a bilingual Traditional Chinese / English JSON menu and rendering it with a cart calculator.

Live demo:

https://edcth.github.io/menu-translate-tools/

Current demo data: Kayuputi A la Carte Lunch.

## What this repo contains

- `index.html` — static renderer shell.
- `app.js` — loads menu JSON, renders bilingual menu cards, manages cart, drawer, custom add-ons, and localStorage persistence.
- `styles.css` — renderer styling.
- `menu.bilingual.json` — example menu data source.
- `schemas/menu.bilingual.schema.json` — target JSON shape for future OCR/translation jobs.

## Reusable workflow

When a new menu arrives as a PDF/image/link:

1. Extract source text.
   - Text PDF / FlippingBook: prefer embedded text/search layer.
   - Scanned PDF / photo: OCR first, then manually sanity-check prices and tax notes.
2. Normalize into `schemas/menu.bilingual.schema.json`.
3. Translate to Traditional Chinese while keeping original English/source wording.
4. Include tax/service model:
   - `price.amount` = listed menu price.
   - If listed prices include tax/service, set `tax_and_service.included_in_listed_prices = true`.
   - `pre_service_tax_estimate = amount / (1 + rate_percent / 100)`.
   - `included_service_tax_estimate = amount - pre_service_tax_estimate`.
5. Replace or add a JSON file, then open the renderer with `?data=path/to/menu.json`, or edit the default `jsonUrl` field in the UI.
6. Verify locally with `python3 -m http.server`, never `file://`.

## Local preview

```bash
python3 -m http.server 8765
open http://localhost:8765/
```

## Cart behavior

- Menu items and custom add-ons are counted in the same cart.
- Custom add-on amounts are treated as listed prices inclusive of 21% service charge and government tax by default.
- Cart state is persisted in browser `localStorage` under `menu-translate-tools:cart:v1` for the current deployment origin.
- `清空 Cart` clears both UI state and localStorage.

## Notes

This is a static prototype/tooling repo, not a payment/order submission system. No data leaves the browser except static asset loading from GitHub Pages.
