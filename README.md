# Split Bill

Split a restaurant bill by item, then send each person their share on WhatsApp.

**Live:** https://nicholaslie90.github.io/split-bill/

- Tag who shared each item — nobody pays for what they didn't order.
- Service charge and tax entered once as percentages, allocated in proportion to each person's subtotal. Shares always add up to the bill total exactly (largest-remainder rounding, no lost rupiah).
- Discount as a rupiah amount, split evenly per head (a voucher is worth the same to everyone), capped at the bill total.
- **PDF** of the whole bill: on a phone the share sheet hands it straight to WhatsApp; on desktop it downloads.
- **▸ WhatsApp** per person: opens WhatsApp with their itemised share prefilled. Add their phone number to go straight to the chat, or leave it blank and pick the contact in WhatsApp.
- No accounts, no server. The bill lives in your browser's `localStorage`.

## Files

| | |
|---|---|
| `index.html` | the whole app — markup, styles, UI logic |
| `split.js` | the money math (item slices, proportional charges, rounding, phone → `wa.me`) |
| `test.mjs` | `node test.mjs` — asserts the shares always reconcile |

## Run locally

ES modules need HTTP, so `file://` won't work:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
node test.mjs                 # prints "ok"
```

## Notes

- Amounts are whole rupiah. Phone numbers without a country code are assumed Indonesian (`08…` → `+62…`); type `+<code>…` for anywhere else.
- Tax is charged on subtotal + service charge by default (Indonesian convention) — there's a checkbox to turn that off.
- [jsPDF](https://github.com/parallax/jsPDF) is loaded from a CDN with an SRI hash; PDF export needs a connection, the rest works offline.
