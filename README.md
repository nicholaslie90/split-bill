# Split Bill

Split a restaurant bill by item, then send each person their share on WhatsApp.

**Live:** https://nicholaslie90.github.io/split-bill/

- Tag who shared each item — nobody pays for what they didn't order.
- Service charge and tax as a percentage, a flat rupiah amount, or both — allocated in proportion to each person's subtotal.
- Discount the same way — but split evenly per head, since a voucher is worth the same to everyone. Capped at the bill total.
- Optionally round the total down to the nearest 100, 500 or 1.000 ("pembulatan"), so nobody hands over coins.
- Amounts group themselves as you type — `59000` becomes `59.000` — with dots or commas to taste. The preference follows through to the summary, the PDF and the WhatsApp message.
- Each person's total is the plain half-up rounding of what they actually owe — `.5` and up goes up, below stays put — and the shares still add up to the bill exactly. Where arithmetic makes both impossible (two shares of exactly `.5`), one person gives a single rupiah rather than the bill going out by one.
- **PDF** of the whole bill: on a phone the share sheet hands it straight to WhatsApp; on desktop it downloads.
- **▸ WhatsApp** per person: opens WhatsApp with their itemised share prefilled. Add their phone number to go straight to the chat, or leave it blank and pick the contact in WhatsApp.
- Tick who paid the whole bill up front ("nalangin") and their message flips around: what they laid out, who owes them, and how much should come back. Everyone else's message names them, so nobody has to ask who to pay. What comes back plus the payer's own share is always the bill exactly.
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
